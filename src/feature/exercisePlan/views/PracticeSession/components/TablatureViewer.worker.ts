/// <reference lib="webworker" />

import type { FillStep } from "../utils/fillFeed";
import type { NoteTiming } from "../utils/timingGrade";
import { addFillSteps, clearLiveFills, createLiveFills, currentTiming, isLiveTiming, liveFillBeat, liveFillOn } from "./liveNoteFills";
import { applyHitNotes, applyMissedNotes, createNoteHitVisualState, resetFrozenNoteState, resetNoteHitVisualState } from "./noteHitVisualState";
import { stringRow } from "./tablatureStringRows";
import type { BeatXMap } from "./tabSpacing";
import { baseBeatWidth, beatToX, buildBeatXMap, xToBeat } from "./tabSpacing";
import { audioClockNow, createAudioClock, observeAudioClock, resetAudioClock } from "./workerAudioClock";

// ── Layout constants ──────────────────────────────────────────────────────────
// World-space design height of the score. The whole drawing is scaled by
// H / BASE_H so stretching the viewer window enlarges the notation
// proportionally. Keep in sync with TAB_BASE_HEIGHT in useTablatureWorkerBridge.
const BASE_H = 300;
// Vertical gap between strings. Driven by STYLE — the main thread bakes the same
// value into every note's noteY, so the two must never drift apart.
let STRING_SPACING = 32;
// Upside-down staff (low E on the top line). Driven by STYLE — the main thread
// bakes the same order into every note's noteY, so the two must never drift
// apart; everything derived from a string NUMBER here goes through stringRow().
let flipStrings = false;
// Mirrored board (music running right to left). The flip itself is a CSS
// transform on the canvas element — the worker only needs to know about it so
// the text it draws does not come out backwards (see drawText).
let rightToLeft = false;
// Width (world px) of the pinned left "tuning gutter" that shows each string's
// tuned note. Content is inset by this much when tuning data is present so the
// first notes don't hide behind the labels. Keep in sync with TAB_GUTTER_W in
// useTablatureWorkerBridge.ts.
const GUTTER_W = 36;
// Pill geometry. Height and corner radius are overwritten by the PILL_STYLE
// message so the player can pick a note-pill shape; the defaults below mirror
// the "rounded" preset in tablaturePillPresets.ts.
let BLOCK_H = 22;   // pill height
let BLOCK_CORNER = 5;    // rounded corner radius
const BLOCK_GAP = 4;    // gap between consecutive block right edges and next beat
const BLOCK_PAD = 4;    // left padding from beat start
const STAFF_TOP = 62;
const STEM_TOP_Y = 12;
// Noteheads sit low in the lane so the stems get a readable length (~19px).
const RHY_HEAD_Y = STAFF_TOP - 31;
const RHY_HEAD_R = 4;
const RHY_STEM_W = 1.1;
// Picking-direction markers (⊓ / ⋁) sit in the empty strip between the rhythm
// lane's noteheads and the top string, exactly where a printed score puts them.
const PICK_Y = STAFF_TOP - 17;
const PICK_W = 9;
const PICK_H = 8;
const BEAM_H = 2.5;
const BEAM_GAP = 2.5;
// Recomputed from `inkColor` whenever a STYLE message lands (see below), so the
// rhythm lane stays legible on light boards too.
let RHYTHM_COLOR = "rgba(255,255,255,0.6)";
/** Picking markers read as an instruction, so they sit a shade above the rhythm lane. */
let PICK_COLOR = "rgba(255,255,255,0.65)";

// ── User style (driven by the STYLE message; see tablatureSettings.ts) ────────
// Per-string palette, used here for slide lines. The pill fill colour itself
// arrives baked into each note by the main thread's render data.
let stringColors: string[] = ["#f87171", "#fb923c", "#facc15", "#4ade80", "#60a5fa", "#c084fc"];
// Scoring feedback colours: solid fill over a sustained note + brighter glow.
let hitFill = "#10b981";
let hitGlow = "#34d399";
/** How long a hit's timing label stays up — a glance, not a verdict. */
const TIMING_LABEL_MS = 700;
/** Board colour. The gutter strip and the played-notes fade paint with it so
 *  scrolled-past notes dissolve into the same background the container shows. */
let bgColor = "#09090b";
/** Colour of everything drawn ON the board (staff, bar lines, rhythm, chord
 *  pills). Inverts to near-black for light boards. White highlights painted on
 *  top of the coloured note pills stay white — they are pill sheen, not ink. */
let inkColor = "#ffffff";
/** Fret-number colour, or "auto" to derive it per pill from that pill's brightness. */
let fretTextColor = "#000000";

// Colour strings are derived from the same few inputs every frame — a handful of
// colours at fixed alphas — so each result is kept: a repeat is a Map lookup,
// with no hex parsing and no new string for the GC. Animated alphas only churn
// their own colour's entries, and every cache is capped.
const COLOR_CACHE_MAX = 64;
const readableInkCache = new Map<string, string>();

/** Black or white, whichever stays readable on `hex`. Rec. 709 luma. */
function readableInk(hex: string): string {
  let ink = readableInkCache.get(hex);
  if (ink !== undefined) return ink;
  if (hex.length !== 7 || hex[0] !== "#") {
    ink = "#000000";
  } else {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    ink = 0.2126 * r + 0.7152 * g + 0.0722 * b > 140 ? "#000000" : "#ffffff";
  }
  if (readableInkCache.size >= COLOR_CACHE_MAX) readableInkCache.clear();
  readableInkCache.set(hex, ink);
  return ink;
}

/** The `amount`-keyed results kept for `hex` in `cache`, made (and the whole
 *  cache emptied if it has grown too big) when there are none yet. */
function colorEntries(cache: Map<string, Map<number, string>>, hex: string): Map<number, string> {
  let entries = cache.get(hex);
  if (!entries) {
    if (cache.size >= COLOR_CACHE_MAX) cache.clear();
    entries = new Map();
    cache.set(hex, entries);
  } else if (entries.size >= COLOR_CACHE_MAX) {
    entries.clear();
  }
  return entries;
}
/** Multiplier on the 13px fret-number base size. */
let fretFontScale = 1;
// Toggles for optional layers of the score.
let showRhythmLane = true;
let showChordNames = true;
let showMeasureLines = true;
let showTechniqueLabels = true;
let hitAnimations = true;
/** Timing feedback on the notes — labels and the late fill (STYLE.timingHints). */
let timingHints = true;
/** Head + thin sustain tail (true) or the classic one-block bar (false). */
let noteTails = true;

const withAlphaCache = new Map<string, Map<number, string>>();

/** "#rrggbb" → "rgba(r,g,b,a)". Used where a hit colour needs a live alpha. */
function withAlpha(hex: string, a: number): string {
  const kept = withAlphaCache.get(hex)?.get(a);
  if (kept !== undefined) return kept;
  if (hex.length !== 7 || hex[0] !== "#") return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const out = `rgba(${r},${g},${b},${a})`;
  colorEntries(withAlphaCache, hex).set(a, out);
  return out;
}

// Staff lines batched into 3 alpha groups (pairs: 0+5, 1+4, 2+3)
const STAFF_LINE_GROUPS: { alpha: number; indices: number[] }[] = [
  { alpha: 0.45, indices: [0, 5] },
  { alpha: 0.33, indices: [1, 4] },
  { alpha: 0.21, indices: [2, 3] },
];

// ── Shared types (mirrored from TablatureViewer.tsx) ──────────────────────────
interface NoteRD {
  noteKey: string;
  /** 1–6 string number (1 = high e) — which line it lands on depends on flipStrings. */
  string: number;
  noteY: number;
  fret: number;
  color: string;
  isAccented?: boolean;
  isHammerOn?: boolean;
  isPullOff?: boolean;
  isBend?: boolean;
  bendSemitones?: number;
  isPreBend?: boolean;
  isRelease?: boolean;
  isVibrato?: boolean;
  isTap?: boolean;
  dynamics?: number;
  // Extended techniques
  isDead?: boolean;
  isGhost?: boolean;
  isPalmMute?: boolean;
  isLetRing?: boolean;
  isStaccato?: boolean;
  harmonicType?: number;
  slideIn?: number;
  slideOut?: number;
}

interface BeatRD {
  offsetX: number;
  duration: number;
  topNoteY: number;
  chordName?: string;
  beamRight: boolean;
  beamRight2: boolean;
  prevBeamRight: boolean;
  prevBeamRight2: boolean;
  notes: NoteRD[];
  isRest: boolean;
  tuplet?: number;
  pickStroke?: "down" | "up";
  inAccentedBar?: boolean;
}

interface TimeSigMarker { x: number; sig: [number, number]; }
interface TupletGroup { x1: number; x2: number; num: number; }
interface TempoPoint { beatPos: number; ratio: number; }

// ── Worker state ──────────────────────────────────────────────────────────────
let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;

/**
 * Every string of text on the board, drawn so it reads forwards on a mirrored
 * one too: flipping a label about its own anchor cancels the board's mirror
 * into a pure translation, which leaves alignment and baseline behaving exactly
 * as they do normally — the label simply lands on the mirrored spot.
 */
function drawText(text: string, x: number, y: number) {
  if (!ctx) return;
  if (!rightToLeft) { ctx.fillText(text, x, y); return; }
  ctx.save();
  ctx.translate(x, 0);
  ctx.scale(-1, 1);
  ctx.fillText(text, 0, y);
  ctx.restore();
}
let dpr = 1;
let rafId: ReturnType<typeof requestAnimationFrame> | null = null;

// Render data
let renderBeats: BeatRD[] = [];
let measureEndXs: number[] = [];
let totalBeats = 1;
let hasAccentedNotes = false;
let hasDynamics = false;
let timeSigMarkers: TimeSigMarker[] = [];
let tupletGroups: TupletGroup[] = [];
let tempoMap: TempoPoint[] = [];
let cachedLoopSeconds = 0; // recomputed when bpm or tempoMap changes

// Viewport
let W = 0;
let H = 256;
// Uniform display scale derived from the viewer height (H / BASE_H). World
// coordinates stay height-independent; only the transform and the viewport
// extent (viewW/viewH) change with it.
let vscale = 1;

// Horizontal zoom multiplier applied to the base beat-width (1 = default).
// <1 compresses the score so more of it fits on screen; >1 enlarges it.
let zoom = 1;

// Where every beat sits (see tabSpacing.ts) and every bar line with it, rebuilt
// by relayout() whenever one of its inputs changes.
let xMap: BeatXMap = buildBeatXMap([], 1, baseBeatWidth(0), { pillHeight: BLOCK_H, fretFontScale });
let measureEndPx: number[] = [];

// Playback
let isPlaying = false;
let startWallMs: number | null = null;
let bpm = 120;
let countInRemaining = 0;

// Audio-clock sync: AudioContext.currentTime readings from the main thread
// (TICK), smoothed between them — see workerAudioClock.ts.
let audioStartSec: number | null = null;
const audioClock = createAudioClock();
/** TICKs feed the clock. Without them (a board given no AudioContext) the fill
 *  steps' own stamps are all it has — those only time the fills, not the cursor. */
let clockFromTicks = false;

// Visual state — hit/miss overlay bookkeeping lives in noteHitVisualState.ts
// (see there for how HIT_NOTES/MISSED_NOTES/RESET/DATA update it) so it can be
// unit tested without a real Worker/OffscreenCanvas.
const visual = createNoteHitVisualState();
/** noteKey -> timing of its hit (NOTE_TIMINGS, see timingGrade.ts). Kept apart
 *  from the hit maps: it isn't frozen per pass, a re-hit note just overwrites
 *  its own entry. */
let noteTimings: Record<string, NoteTiming> = {};
type TimingLabelKind = "early" | "late" | "perfect";

// ── Live pitch: bend gauge & note tuner ────────────────────────────────────
/** The note under the matching cursor (TICK.pitch — LivePitch in
 *  pitchScoring.ts): for a bend or release how far the move has gone, 0 → 1;
 *  for any note the cents from the pitch it is written to end on. A held
 *  note only arrives here when the exercise scores intonation. */
let livePitch: { noteKey: string; kind: "bend" | "release" | "note"; amount: number | null; cents: number | null } | null = null;
/** What the gauge of a bend currently draws. Eased toward the live reading so a
 *  ~30 fps feed glides instead of stepping, and held where the string got to
 *  once the note is over. `tile` pins it to the pass it was played in. */
const bendGauges = new Map<string, { tile: number; amount: number; locked: boolean; lockAt: number }>();
/** A bend inside this many cents of its pitch, and most of the way there, locks in. */
const BEND_LOCK_CENTS = 20;
const BEND_LOCK_PULSE_MS = 450;
/** Past this the string has gone sharp of the target. */
const BEND_OVERSHOOT = 1.08;
const BEND_SHARP_COLOR = "#f59e0b";

/** What the tuner over a held note currently shows, eased like the bend gauge. */
const noteTuners = new Map<string, { tile: number; cents: number; lockAt: number | null }>();
/** The tuner's arc spans ±TUNER_RANGE_CENTS over ±TUNER_SWEEP radians. */
const TUNER_RANGE_CENTS = 50;
const TUNER_SWEEP = Math.PI / 3;
/** Cents bands of the intonation grades (pitchScoring.ts IN_TUNE / CLOSE). */
const IN_TUNE_CENTS = 20;
const CLOSE_CENTS = 40;
/** Steadily inside this, the tuner locks with a pulse. */
const TUNER_LOCK_CENTS = 8;
const INTONATION_CLOSE_COLOR = "#f59e0b";
const INTONATION_OFF_COLOR = "#f97316";

/** Colour of an intonation grade: the hit green, then amber, then orange. */
function intonationColor(grade: number): string {
  return grade >= 3 ? hitFill : grade === 2 ? INTONATION_CLOSE_COLOR : INTONATION_OFF_COLOR;
}
function intonationColorForCents(cents: number): string {
  const off = Math.abs(cents);
  return off <= IN_TUNE_CENTS ? hitFill : off <= CLOSE_CENTS ? INTONATION_CLOSE_COLOR : INTONATION_OFF_COLOR;
}
/** noteKey -> the timing label it shows and when it went up. Emptied as labels expire. */
const timingLabels = new Map<string, { kind: TimingLabelKind; at: number }>();
let hideNotes = false;

// Per-string tuning legend drawn pinned to the left edge (string 1 = high e …
// string 6 = low E). Empty → no gutter, no content inset (editor/preview views).
// Which strings light up is decided per-frame from the cursor (see the gutter draw).
interface TuningStringInfo { string: number; label: string; color: string; }
let tuningStrings: TuningStringInfo[] = [];
// Beats of anticipation: a string lights up once a note it carries is within this
// many beats ahead of the cursor (or is still ringing under it).
const TUNING_LOOKAHEAD_BEATS = 2;

// Repetition that most recently FINISHED — the one a matching reset's frozen
// snapshot describes. Matching grades against a clock shifted back by the input
// latency (~80-150ms), so its loop reset always reaches us *after* the visual
// cursor has already crossed into the next repetition. Pinning the snapshot to
// the tile the cursor sits in (what this used to do) therefore painted the
// finished pass's greens over the pass being played right now — the board read
// one full loop behind, and kept repainting the same greens with nothing being
// played. Which side of the boundary the cursor is on tells us which pass ended.
let lastFinishedTile = 0;

// Hit animation timestamps — noteKey → wall-clock ms when note was first hit
const HIT_ANIM_MS = 320;

// Visual cache for progressive fills to prevent backward snapping during latency variance
const noteVisualFill = new Map<string, number>();
// Hits and holds as the matching loop streams them (FILL_STEPS) — where a note
// has one, its fill is drawn from it rather than eased toward React's copy.
const liveFills = createLiveFills();
// Where the last playing frame had the cursor, to place incoming fill steps on a tile.
let lastDispCursor = 0;
let lastSeamless = false;

/** The board tile a streamed fill step was played on: the repetition whose
 *  copy of its beat lies nearest the cursor — matching runs behind the cursor
 *  by the input latency, so right after a wrap that is still the tile before. */
function liveFillTile(beat: number): number {
  const totalW = xMap.totalX;
  if (!lastSeamless || totalW <= 0) return 0;
  return Math.max(0, Math.round((lastDispCursor - beatToX(xMap, beat)) / totalW));
}

/** How wide a note's fill is when held through `heldBeat`, within its block. */
function heldFillWidth(heldBeat: number, beatPx: number, beatOffset: number, pxPerBeat: number, blockX: number, blockW: number): number {
  return Math.max(0, Math.min(blockW, beatPx + (heldBeat - beatOffset) * pxPerBeat - blockX));
}

// ── Performance: module-level reuse ──────────────────────────────────────────
// Reused each frame instead of allocating a new Map on every rAF tick
const stringLastPos = new Map<number, { x: number; cx: number; y: number; slideOut: number }>();
// Dirty flag — skip rAF paint when nothing changed (paused, no animations)
let needsRedraw = true;
// False while something opaque covers the board (the alignment screen). Playback
// is unaffected — this worker only ever draws — so the frames are simply skipped
// until it comes back, and the dirty flag above survives to force one repaint.
let isVisible = true;
// Cache for bend badge text widths — ctx.measureText is expensive, text never changes
const bendTextWidthCache = new Map<string, number>();

// Scrub/pause position (writable by SCROLL message when paused)
let pausedCursorPos = 0;
let pausedScrollX = 0;

// ── Learn mode: the beat the lesson is waiting for the player to play ────────
/** LEARN message. `since` restarts the settle-in whenever the target moves on. */
let learnTarget: { keys: Set<string>; beatStart: number; beatEnd: number; since: number } | null = null;
/** The system asked for less motion (the main thread can read that, a worker can't). */
let reducedMotion = false;
/** A glide in progress (SCROLL with `smooth`): the paused view easing to its next resting place. */
let glide: { fromCursor: number; fromScroll: number; toCursor: number; toScroll: number; start: number } | null = null;
const GLIDE_MS = 320;
const LEARN_SETTLE_MS = 320;
const LEARN_PING_MS = 1100;
const LEARN_COLOR = "#22d3ee";
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
/** Motion is off when the tab's animations are, or the system asks for less. */
const learnIsCalm = () => !hitAnimations || reducedMotion;

/**
 * Rebuilds where the beats sit after one of the inputs moved them — the notes,
 * the board's width, the zoom, the pill size. The paused view is kept in pixels,
 * and the pixels of every beat just changed, so it is carried over by beat: the
 * same beat stays under the cursor and at the left edge.
 */
function relayout() {
  const prev = xMap;
  xMap = buildBeatXMap(renderBeats, totalBeats, baseBeatWidth(W) * zoom, { pillHeight: BLOCK_H, fretFontScale });
  measureEndPx = measureEndXs.map((beat) => beatToX(xMap, beat));
  const carry = (x: number) => beatToX(xMap, xToBeat(prev, x));
  pausedCursorPos = carry(pausedCursorPos);
  pausedScrollX = carry(pausedScrollX);
  if (glide) {
    glide.fromCursor = carry(glide.fromCursor); glide.toCursor = carry(glide.toCursor);
    glide.fromScroll = carry(glide.fromScroll); glide.toScroll = carry(glide.toScroll);
  }
}

// Hover preview — world-X of the measure start being hovered (null = no hover)
let hoverStartX: number | null = null;

// What the tab editor currently has selected, mirrored here so the preview can
// mark the same spot. Beats are world positions, strings are 1–6 (1 = high e).
// null = nothing selected (or no editor driving this viewer at all).
let selection: { startBeat: number; endBeat: number; startString: number; endString: number } | null = null;

// Sub-loop range in beats (null = full song loop)
let loopStartBeat: number | null = null;
let loopEndBeat:   number | null = null;

// Rest-active state — track changes to avoid flooding main thread
let lastRestActive = false;

// Whether user is playing sound during a rest (set by main thread)
let showRestWarning = false;

// ── SMuFL music font (Bravura) ────────────────────────────────────────────────
// Reuse the Bravura webfont already served for AlphaTab (public/alphatab/font) so
// the rhythm symbols render as real engraved glyphs instead of hand-drawn shapes.
// It is loaded into the worker's OWN FontFaceSet; until that resolves — or if the
// runtime can't load fonts inside a worker — `bravuraReady` stays false and every
// symbol falls back to the drawn shapes below, so the tab never renders blank.
let bravuraReady = false;
const RHY_GLYPH_PX = 30; // Bravura rhythm-symbol size, tuned to the ruler height
const RHY_GLYPH_FONT = `${RHY_GLYPH_PX}px Bravura`;
// SMuFL codepoints (Bravura is SMuFL-compliant).
const GLYPH_NOTEHEAD = { whole: "", half: "", black: "" };
const GLYPH_FLAG_UP: Record<number, string> = { 1: "", 2: "", 3: "" }; // 8th / 16th / 32nd
const GLYPH_REST = {
  whole: "", half: "", quarter: "",
  eighth: "", sixteenth: "", thirtysecond: "",
};

(function loadBravura() {
  try {
    const g = self as unknown as { fonts?: { add: (f: FontFace) => void } };
    if (!g.fonts || typeof FontFace === "undefined") return;
    const face = new FontFace("Bravura", "url(/alphatab/font/Bravura.woff2)");
    face.load().then(f => { g.fonts!.add(f); bravuraReady = true; needsRedraw = true; })
      .catch(() => { /* keep the hand-drawn fallback */ });
  } catch { /* FontFace / worker fonts unsupported — keep the fallback */ }
})();

/** Draw a SMuFL glyph from Bravura at (x, y). Colour is inherited from ctx.fillStyle. */
function drawGlyph(g: string, x: number, y: number, align: CanvasTextAlign = "center", baseline: CanvasTextBaseline = "middle") {
  if (!ctx) return;
  ctx.font = RHY_GLYPH_FONT;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  drawText(g, x, y);
}

const lightenCache = new Map<string, Map<number, string>>();

// Lighten a "#rrggbb" colour toward white by `amt` (0..1). Non-hex passes through.
function lightenHex(hex: string, amt: number): string {
  const kept = lightenCache.get(hex)?.get(amt);
  if (kept !== undefined) return kept;
  if (hex.length !== 7 || hex[0] !== "#") return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amt);
  const out = `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
  colorEntries(lightenCache, hex).set(amt, out);
  return out;
}

// Fonts the board sets per note, as fixed strings. The browser skips setting
// the font it already has (~0.1 µs), but switching between two costs ~10× that
// — so a string is built once per size, and the small label font goes on only
// for a note that actually carries one of its labels.
const fretFonts = new Map<number, string>();
function fretFont(px: number): string {
  let font = fretFonts.get(px);
  if (font === undefined) {
    font = `bold ${px}px Inter, sans-serif`;
    fretFonts.set(px, font);
  }
  return font;
}
const TECHNIQUE_FONT = "bold 9px Inter";
/** Tuplet number widths — the bracket arms stop short of the number. */
const tupletLabelWidths = new Map<number, number>();

// Opaque blend of two "#rrggbb" colours, `amt` (0..1) of the way from `from` to
// `to`. Anything that isn't hex falls back to `to` at that opacity.
function mixHex(from: string, to: string, amt: number): string {
  if (from.length !== 7 || from[0] !== "#" || to.length !== 7 || to[0] !== "#") return withAlpha(to, amt);
  const mix = (i: number) => {
    const a = parseInt(from.slice(i, i + 2), 16);
    const b = parseInt(to.slice(i, i + 2), 16);
    return Math.round(a + (b - a) * amt);
  };
  return `rgb(${mix(1)}, ${mix(3)}, ${mix(5)})`;
}

// ── Pick stroke marker ────────────────────────────────────────────────────────
/** The printed picking symbols: ⊓ for a downstroke, ⋁ for an upstroke, centred on `x`. */
function drawPickStroke(stroke: "down" | "up", x: number) {
  if (!ctx) return;
  const half = PICK_W / 2;
  ctx.strokeStyle = PICK_COLOR;
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  if (stroke === "down") {
    // Open-bottomed bracket — the ⊓ every score uses for a downstroke.
    ctx.moveTo(x - half, PICK_Y + PICK_H / 2);
    ctx.lineTo(x - half, PICK_Y - PICK_H / 2);
    ctx.lineTo(x + half, PICK_Y - PICK_H / 2);
    ctx.lineTo(x + half, PICK_Y + PICK_H / 2);
  } else {
    ctx.moveTo(x - half, PICK_Y - PICK_H / 2);
    ctx.lineTo(x, PICK_Y + PICK_H / 2);
    ctx.lineTo(x + half, PICK_Y - PICK_H / 2);
  }
  ctx.stroke();
}

// ── Palm mute ─────────────────────────────────────────────────────────────────
// Measured once — the label and its font never change.
let palmMuteLabelW = 0;

/**
 * "P.M." under a palm-muted beat, centred on its note head, in the row below
 * the staff. One per muted note rather than a span line, so nothing runs under
 * the notes that ring. `room` is the beat's width: too narrow a beat gets "PM".
 */
function drawPalmMuteLabel(x: number, room: number, live: boolean) {
  if (!ctx) return;
  const staffBottom = STAFF_TOP + 5 * STRING_SPACING;
  // Held inside the board when wide string spacing leaves little room under the staff.
  const y = Math.min(BASE_H - 7, staffBottom + BLOCK_H / 2 + 11);
  ctx.font = "bold 11px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = withAlpha(inkColor, live ? 0.95 : 0.6);
  if (palmMuteLabelW === 0) palmMuteLabelW = ctx.measureText("P.M.").width;
  drawText(palmMuteLabelW + 6 <= room ? "P.M." : "PM", x, y);
}

// ── Bend badge ────────────────────────────────────────────────────────────────
function drawBendBadge(
  label: string, icon: string,
  bgColor: string, textColor: string,
  bx: number, by: number, noteY: number,
) {
  if (!ctx) return;
  ctx.font = "bold 16px Inter, sans-serif";
  const fullText = `${icon} ${label}`;
  let tw = bendTextWidthCache.get(fullText);
  if (tw === undefined) { tw = ctx.measureText(fullText).width; bendTextWidthCache.set(fullText, tw); }
  const padX = 8, bw = tw + padX * 2, bh = 24, r = 6;

  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.moveTo(bx - bw / 2 + r, by - bh / 2);
  ctx.lineTo(bx + bw / 2 - r, by - bh / 2);
  ctx.arcTo(bx + bw / 2, by - bh / 2, bx + bw / 2, by - bh / 2 + r, r);
  ctx.lineTo(bx + bw / 2, by + bh / 2 - r);
  ctx.arcTo(bx + bw / 2, by + bh / 2, bx + bw / 2 - r, by + bh / 2, r);
  ctx.lineTo(bx - bw / 2 + r, by + bh / 2);
  ctx.arcTo(bx - bw / 2, by + bh / 2, bx - bw / 2, by + bh / 2 - r, r);
  ctx.lineTo(bx - bw / 2, by - bh / 2 + r);
  ctx.arcTo(bx - bw / 2, by - bh / 2, bx - bw / 2 + r, by - bh / 2, r);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = textColor; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  drawText(fullText, bx, by + 1);

  const lsy = by + bh / 2;
  const ley = noteY - 1; // noteY = top edge of block passed by caller
  if (ley > lsy + 2) {
    ctx.strokeStyle = textColor; ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(bx, lsy); ctx.lineTo(bx, ley); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = textColor;
    ctx.beginPath();
    ctx.moveTo(bx, ley); ctx.lineTo(bx - 3, ley - 6); ctx.lineTo(bx + 3, ley - 6);
    ctx.closePath(); ctx.fill();
  }
}

/**
 * The bend gauge: the curved arrow tab notation draws for a bend, run off the
 * note's head — level along the string, then up to the target pitch (a release
 * mirrors it, down from the target back to the string). The curve fills, and a
 * dot rides it, as far as the string has actually been bent, so the player
 * watches their bend climb toward the line it has to reach.
 *
 * `amount` is how far the move has gone (0 → 1, past 1 = sharp). `verdict`
 * is the intonation result once the note has been graded, drawn as a label at
 * the top; null while it plays or where pitch isn't scored.
 */
function drawBendGauge(
  kind: "bend" | "release",
  x0: number, baseY: number, w: number, h: number,
  amount: number, color: string,
  lockAge: number | null,
  verdict: { grade: number; cents: number | null } | null,
) {
  if (!ctx) return;
  const topY = baseY - h;
  const x1 = x0 + w;
  const startY = kind === "bend" ? baseY : topY;
  const endY = kind === "bend" ? topY : baseY;
  const cx = x0 + w * 0.8;
  const pointAt = (t: number): [number, number] => {
    const u = 1 - t;
    return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * startY + 2 * u * t * startY + t * t * endY];
  };
  const sharp = amount > BEND_OVERSHOOT;
  const t = Math.max(0, Math.min(1, amount));

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // The pitch the bend has to reach, as a faint guide line.
  if (kind === "bend") {
    ctx.strokeStyle = withAlpha(inkColor, 0.22);
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(x0, topY); ctx.lineTo(x1 + 6, topY); ctx.stroke();
    ctx.setLineDash([]);
  }

  // The whole move, ghosted…
  ctx.strokeStyle = withAlpha(inkColor, 0.16);
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x0, startY); ctx.quadraticCurveTo(cx, startY, x1, endY); ctx.stroke();

  // …and the part of it the string has covered.
  const fillColor = sharp ? BEND_SHARP_COLOR : color;
  if (t > 0.01) {
    ctx.strokeStyle = fillColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x0, startY);
    const steps = Math.max(2, Math.ceil(t * 16));
    for (let i = 1; i <= steps; i++) {
      const [px, py] = pointAt((t * i) / steps);
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Target: an open ring the dot has to fill.
  ctx.strokeStyle = withAlpha(inkColor, 0.45);
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x1, endY, 5, 0, Math.PI * 2); ctx.stroke();

  // Lock-in: a ring that flies off the target the moment the bend lands.
  if (lockAge !== null && lockAge < 1) {
    const eased = 1 - (1 - lockAge) * (1 - lockAge);
    ctx.strokeStyle = withAlpha(hitGlow, 0.85 * (1 - lockAge));
    ctx.lineWidth = 2.5 * (1 - lockAge) + 0.5;
    ctx.beginPath(); ctx.arc(x1, endY, 5 + eased * 12, 0, Math.PI * 2); ctx.stroke();
  }

  // The string, right now.
  const [dx, dy] = pointAt(t);
  ctx.fillStyle = fillColor;
  ctx.beginPath(); ctx.arc(dx, dy, 4.5, 0, Math.PI * 2); ctx.fill();

  if (verdict) {
    const inTune = verdict.grade >= 3;
    const label = verdict.cents === null
      ? "—"
      : inTune ? "in tune" : `${verdict.cents > 0 ? "+" : "−"}${Math.abs(verdict.cents)}¢`;
    ctx.font = "600 11px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = inTune ? hitGlow : intonationColor(verdict.grade);
    drawText(label, x1 + 10, endY);
  }
  ctx.restore();
}

/**
 * The tuner over a held note, for exercises that score intonation: an arc
 * across the top of the note's head — flat on the left, sharp on the right,
 * the in-tune band lit in the hit green — and a dot riding it at the pitch
 * the string is sounding right now. The dot, and the note's fill, go green
 * inside the band, amber a little out, orange further. Settle into the middle
 * and the tuner locks with a pulse.
 */
function drawNoteTuner(cx: number, cy: number, cents: number, lockAge: number | null) {
  if (!ctx) return;
  const r = 15;
  const angleFor = (c: number) => -Math.PI / 2 + (Math.max(-TUNER_RANGE_CENTS, Math.min(TUNER_RANGE_CENTS, c)) / TUNER_RANGE_CENTS) * TUNER_SWEEP;
  const color = intonationColorForCents(cents);
  ctx.save();
  ctx.lineCap = "round";

  // Scale: the whole range, then the in-tune band on top of it.
  ctx.strokeStyle = withAlpha(inkColor, 0.18);
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, r, angleFor(-TUNER_RANGE_CENTS), angleFor(TUNER_RANGE_CENTS)); ctx.stroke();
  ctx.strokeStyle = withAlpha(hitFill, 0.55);
  ctx.beginPath(); ctx.arc(cx, cy, r, angleFor(-IN_TUNE_CENTS), angleFor(IN_TUNE_CENTS)); ctx.stroke();

  // Centre mark — the written pitch.
  ctx.strokeStyle = withAlpha(inkColor, 0.6);
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx, cy - r - 4); ctx.lineTo(cx, cy - r + 3); ctx.stroke();

  const a = angleFor(cents);
  const dx = cx + Math.cos(a) * r;
  const dy = cy + Math.sin(a) * r;
  if (lockAge !== null && lockAge < 1) {
    const eased = 1 - (1 - lockAge) * (1 - lockAge);
    ctx.strokeStyle = withAlpha(hitGlow, 0.85 * (1 - lockAge));
    ctx.lineWidth = 2.5 * (1 - lockAge) + 0.5;
    ctx.beginPath(); ctx.arc(dx, dy, 4 + eased * 10, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(dx, dy, 4.5, 0, Math.PI * 2); ctx.fill();

  // Out of the band, say by how much — that's what tells you which way to go.
  if (Math.abs(cents) > IN_TUNE_CENTS) {
    ctx.font = "700 11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = color;
    drawText(`${cents > 0 ? "+" : "−"}${Math.round(Math.abs(cents))}`, cx, cy - r - 6);
  }
  ctx.restore();
}

/**
 * What a held note's intonation came out as, once it has played out — only
 * for notes that missed the band: the cents, and an arrow saying which way the
 * string was off (up = sharp). The note's fill carries the grade's colour.
 */
function drawIntonationVerdict(cx: number, y: number, grade: number, cents: number) {
  if (!ctx) return;
  const color = intonationColor(grade);
  const sharp = cents > 0;
  const label = `${sharp ? "+" : "−"}${Math.abs(cents)}¢`;
  ctx.save();
  ctx.font = "700 11px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = color;
  const w = ctx.measureText(label).width;
  drawText(label, cx - 4, y);
  // Little caret after the number: up for sharp, down for flat.
  const ax = cx - 4 + w / 2 + 6;
  const ay = y - 6;
  ctx.beginPath();
  if (sharp) { ctx.moveTo(ax - 3.5, ay + 2); ctx.lineTo(ax, ay - 2.5); ctx.lineTo(ax + 3.5, ay + 2); }
  else { ctx.moveTo(ax - 3.5, ay - 2); ctx.lineTo(ax, ay + 2.5); ctx.lineTo(ax + 3.5, ay - 2); }
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.75;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();
}

/**
 * Where an off-beat hit was played, kept under its note for the rest of the
 * pass: a short arrow pointing left for early (ahead of the beat, which on the
 * board is to the left) and right for late. The "Early"/"Late" word over the
 * note fades right away; the arrow is what's left to read back afterwards.
 */
function drawTimingArrow(cx: number, y: number, early: boolean, strong: boolean) {
  if (!ctx) return;
  const half = 7;
  const tipX = early ? cx - half : cx + half;
  const tailX = early ? cx + half : cx - half;
  const back = early ? 4 : -4;
  ctx.save();
  ctx.strokeStyle = withAlpha(inkColor, strong ? 0.9 : 0.6);
  ctx.lineWidth = 1.75;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(tailX, y); ctx.lineTo(tipX, y);
  ctx.moveTo(tipX + back, y - 3.5); ctx.lineTo(tipX, y); ctx.lineTo(tipX + back, y + 3.5);
  ctx.stroke();
  ctx.restore();
}

// ── Rounded rectangle (pill) helper ──────────────────────────────────────────
/** Adds a pill sub-path to the current path without starting a new one, so
 *  several pills (a note's head + tail) can be filled or clipped as one shape. */
function pillPath(x: number, y: number, w: number, h: number, r: number, target: OffscreenCanvasRenderingContext2D | null = ctx) {
  if (!target || w <= 0 || h <= 0) return;
  const cr = Math.max(0, Math.min(r, h / 2, w / 2));
  target.moveTo(x + cr, y);
  target.lineTo(x + w - cr, y);
  target.arcTo(x + w, y, x + w, y + cr, cr);
  target.lineTo(x + w, y + h - cr);
  target.arcTo(x + w, y + h, x + w - cr, y + h, cr);
  target.lineTo(x + cr, y + h);
  target.arcTo(x, y + h, x, y + h - cr, cr);
  target.lineTo(x, y + cr);
  target.arcTo(x, y, x + cr, y, cr);
  target.closePath();
}

function drawPill(x: number, y: number, w: number, h: number, r: number) {
  if (!ctx) return;
  ctx.beginPath();
  pillPath(x, y, w, h, r);
}

// ── Chord box ─────────────────────────────────────────────────────────────────
/** Notes a beat needs to be drawn as a chord box rather than note by note. */
const CHORD_BOX_MIN_NOTES = 3;
/** How far the box reaches above its top note and below its bottom one. */
const CHORD_BOX_PAD = 3;

/**
 * The box a chord rings in: from its top string to its bottom one, from the
 * strum to where the chord ends — one quiet shape in the board's ink instead
 * of a coloured tail on every string, which stacked up into a wall of colour.
 * Lit while the cursor is in it; the stretch the chord was held for fills with
 * the hit colour, the way a single note's tail does.
 */
function drawChordBox(x: number, w: number, topY: number, bottomY: number, active: boolean, heldW: number, dim: number) {
  if (!ctx) return;
  const y = topY - BLOCK_H / 2 - CHORD_BOX_PAD;
  const h = bottomY - topY + BLOCK_H + CHORD_BOX_PAD * 2;
  const r = BLOCK_CORNER + CHORD_BOX_PAD;
  ctx.fillStyle = inkColor;
  ctx.globalAlpha = (active ? 0.13 : 0.07) * dim;
  drawPill(x, y, w, h, r);
  ctx.fill();
  if (heldW > 0) {
    ctx.save();
    drawPill(x, y, w, h, r);
    ctx.clip();
    ctx.fillStyle = hitFill;
    ctx.globalAlpha = 0.28;
    ctx.fillRect(x, y, Math.min(w, heldW), h);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// ── Hit glow sprites ──────────────────────────────────────────────────────────
// The glow behind a freshly hit note is a canvas shadow, and a shadow is a blur.
// Re-running that blur every frame for every note still glowing was the most
// expensive thing a fast run asked of this renderer, so it is blurred once per
// head width into a small bitmap, and each frame only draws (and fades) that.
// The glow now fades out at full size instead of tightening into the pill as the
// animated blur radius used to — over its ~180 ms the two can't be told apart.
const HIT_GLOW_BLUR = 20;
/** Room for the blur to die out in around the pill: σ = blur / 2, and 3σ out. */
const HIT_GLOW_PAD = Math.ceil(HIT_GLOW_BLUR * 1.5) + 2;
const HIT_GLOW_SPRITES_MAX = 48;
const hitGlowSprites = new Map<string, OffscreenCanvas>();

/** The glow alone (no pill) around a `w`-wide note head, in device pixels, or
 *  null where the worker can't make canvases of its own. */
function hitGlowSprite(w: number): OffscreenCanvas | null {
  if (typeof OffscreenCanvas === "undefined") return null;
  const s = dpr * vscale;
  const wPx = Math.ceil(w * s);
  const hPx = Math.ceil(BLOCK_H * s);
  const key = `${hitGlow}|${wPx}|${hPx}|${BLOCK_CORNER * s}`;
  const cached = hitGlowSprites.get(key);
  if (cached) return cached;

  const sprite = new OffscreenCanvas(wPx + HIT_GLOW_PAD * 2, hPx + HIT_GLOW_PAD * 2);
  const g = sprite.getContext("2d");
  if (!g) return null;
  // Device pixels throughout, like the board's own shadow (shadows ignore the
  // transform). The pill sits a whole sprite-width off to the left and its
  // shadow is offset straight back in, so only the glow lands on the bitmap.
  g.shadowColor = hitGlow;
  g.shadowBlur = HIT_GLOW_BLUR;
  g.shadowOffsetX = sprite.width;
  g.fillStyle = "#000";
  g.beginPath();
  pillPath(HIT_GLOW_PAD - sprite.width, HIT_GLOW_PAD, w * s, BLOCK_H * s, BLOCK_CORNER * s, g);
  g.fill();

  if (hitGlowSprites.size >= HIT_GLOW_SPRITES_MAX) hitGlowSprites.clear();
  hitGlowSprites.set(key, sprite);
  return sprite;
}

// ── Chord names ───────────────────────────────────────────────────────────────
// A chord's name is a small tag on the picking row, just right of the beat's
// notehead and pick mark and clear of the pills, so the beat's rhythm and
// picking stay in view and the tag reads as the header of the chord's column.
// The tag is a solid mix of board and ink — no outline, no glow — which also
// keeps it readable over the cinema-mode video. Each name is painted once into a
// bitmap at device resolution and only blitted per frame, at whole device
// pixels, so the text stays exactly as sharp as text drawn straight on the board.
const CHORD_FONT = "600 13px Inter, sans-serif";
const CHORD_TAG_H = 15;
const CHORD_TAG_PAD_X = 6;
const CHORD_TAG_RADIUS = 4;
/** Tag's left edge from the beat start: past the notehead and pick mark. */
const CHORD_TAG_X = 19;
/** Room between the tag and the tops of the pills under it — kept small so the
 *  tag also stays below the rhythm lane's noteheads. */
const CHORD_TAG_GAP = 2;
const CHORD_TAG_CACHE_MAX = 64;
const chordTagWidths = new Map<string, number>();
const chordTagSprites = new Map<string, OffscreenCanvas>();

/** Paints a `w`-wide chord tag with its top-left corner at the origin of `g`. */
function paintChordTag(g: OffscreenCanvasRenderingContext2D, label: string, w: number) {
  g.fillStyle = mixHex(bgColor, inkColor, 0.12);
  g.beginPath();
  pillPath(0, 0, w, CHORD_TAG_H, CHORD_TAG_RADIUS, g);
  g.fill();
  g.font = CHORD_FONT;
  g.textAlign = "left";
  g.textBaseline = "middle";
  g.fillStyle = inkColor;
  g.fillText(label, CHORD_TAG_PAD_X, CHORD_TAG_H / 2 + 0.5);
}

/** A chord tag painted at device resolution, or null where the worker can't
 *  make canvases of its own. */
function chordTagSprite(label: string, w: number): OffscreenCanvas | null {
  if (typeof OffscreenCanvas === "undefined") return null;
  const s = dpr * vscale;
  const key = `${label}|${bgColor}|${inkColor}|${s}`;
  const cached = chordTagSprites.get(key);
  if (cached) return cached;

  const sprite = new OffscreenCanvas(Math.ceil(w * s), Math.ceil(CHORD_TAG_H * s));
  const g = sprite.getContext("2d");
  if (!g) return null;
  g.setTransform(s, 0, 0, s, 0, 0);
  paintChordTag(g, label, w);

  if (chordTagSprites.size >= CHORD_TAG_CACHE_MAX) chordTagSprites.clear();
  chordTagSprites.set(key, sprite);
  return sprite;
}

/** Draws the chord tag with its top-left corner at world (x, y) and returns its
 *  right edge. On a mirrored board the tag is flipped back as a whole, so its
 *  text reads forwards. */
function drawChordTag(label: string, x: number, y: number): number {
  if (!ctx) return x;
  let w = chordTagWidths.get(label);
  if (w === undefined) {
    ctx.font = CHORD_FONT;
    w = Math.ceil(ctx.measureText(label).width) + CHORD_TAG_PAD_X * 2;
    if (chordTagWidths.size >= CHORD_TAG_CACHE_MAX) chordTagWidths.clear();
    chordTagWidths.set(label, w);
  }

  const sprite = chordTagSprite(label, w);
  if (!sprite) {
    ctx.save();
    ctx.translate(rightToLeft ? x + w : x, y);
    if (rightToLeft) ctx.scale(-1, 1);
    paintChordTag(ctx, label, w);
    ctx.restore();
    return x + w;
  }
  // Snap to whole device pixels: a bitmap drawn between pixels is resampled,
  // which would soften the text as the board scrolls.
  const m = ctx.getTransform();
  const dx = Math.round(m.a * x + m.e);
  const dy = Math.round(m.d * y + m.f);
  ctx.save();
  ctx.setTransform(rightToLeft ? -1 : 1, 0, 0, 1, rightToLeft ? 2 * dx + sprite.width : 0, 0);
  ctx.drawImage(sprite, dx, dy);
  ctx.restore();
  return x + w;
}

/**
 * Marks a note the lesson is waiting for: a glow that breathes behind it, a ring
 * that closes in on it when it becomes the target, and a ping that keeps going
 * out from it for as long as it is. With motion off it is the glow and the ring,
 * standing still.
 */
function drawLearnHalo(x: number, y: number, w: number, h: number, now: number) {
  if (!ctx || !learnTarget) return;
  const calm = learnIsCalm();
  const age = now - learnTarget.since;
  const settle = calm ? 1 : easeOutCubic(Math.min(1, age / LEARN_SETTLE_MS));
  const breathe = calm ? 0.5 : 0.5 + 0.5 * Math.sin(now / 260);

  ctx.save();
  ctx.fillStyle = LEARN_COLOR;
  ctx.globalAlpha = settle * (0.14 + 0.12 * breathe);
  const glow = 6 + 3 * breathe;
  drawPill(x - glow, y - glow, w + glow * 2, h + glow * 2, BLOCK_CORNER + glow);
  ctx.fill();

  const pad = 3 + (1 - settle) * 14;
  ctx.globalAlpha = settle;
  ctx.strokeStyle = LEARN_COLOR;
  ctx.lineWidth = 2;
  drawPill(x - pad, y - pad, w + pad * 2, h + pad * 2, BLOCK_CORNER + pad);
  ctx.stroke();

  if (!calm && age > LEARN_SETTLE_MS) {
    const p = ((age - LEARN_SETTLE_MS) % LEARN_PING_MS) / LEARN_PING_MS;
    const ping = 3 + 16 * easeOutCubic(p);
    ctx.globalAlpha = 0.5 * (1 - p);
    drawPill(x - ping, y - ping, w + ping * 2, h + ping * 2, BLOCK_CORNER + ping);
    ctx.stroke();
  }
  ctx.restore();
}

// Strings whose notes sit under the cursor or within the look-ahead window —
// i.e. the ones "about to be played". `curBeat` is the cursor position in beats
// (tile-0 space). renderBeats are sorted by offsetX, so we binary-search the
// first beat still ringing at the cursor and scan forward until past look-ahead.
function activeTuningStrings(curBeat: number): Set<number> {
  const active = new Set<number>();
  if (tuningStrings.length === 0 || renderBeats.length === 0) return active;
  let lo = 0, hi = renderBeats.length - 1, start = renderBeats.length;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (renderBeats[mid].offsetX + renderBeats[mid].duration >= curBeat) { start = mid; hi = mid - 1; }
    else lo = mid + 1;
  }
  for (let i = start; i < renderBeats.length; i++) {
    const b = renderBeats[i];
    if (b.offsetX > curBeat + TUNING_LOOKAHEAD_BEATS) break;
    for (const n of b.notes) active.add(n.string);
  }
  return active;
}

// ── Tuning gutter ─────────────────────────────────────────────────────────────
// A pinned column at the left edge naming each string's tuned note (reflecting
// the player's active tuning, e.g. Drop D → D A D G B E). A string lights up in
// its own colour only while it's about to be played (see activeTuningStrings);
// the rest stay dimmed. Drawn in screen space (after the scrolling content is
// restored) so it stays put while the tab scrolls underneath and notes vanish
// behind the opaque strip.
function drawTuningGutter(active: Set<number>) {
  if (!ctx || tuningStrings.length === 0) return;
  const viewH = H / vscale;

  // Opaque strip so scrolling notes disappear cleanly behind the labels …
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, GUTTER_W, viewH);
  // … feathered into the staff on its right edge (styleguide: separate with
  // background + space, never a hard border line).
  const edge = ctx.createLinearGradient(GUTTER_W - 10, 0, GUTTER_W, 0);
  edge.addColorStop(0, withAlpha(bgColor, 0.9));
  edge.addColorStop(1, withAlpha(bgColor, 0));
  ctx.fillStyle = edge;
  ctx.fillRect(GUTTER_W - 10, 0, 10, viewH);

  const pillX = 4, pillW = 26, pillH = BLOCK_H, r = BLOCK_CORNER;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const st of tuningStrings) {
    const y = STAFF_TOP + stringRow(st.string, flipStrings) * STRING_SPACING;
    const top = y - pillH / 2;
    // Notes are hidden (ear training) → light every string so we don't leak
    // which one is coming next; otherwise only the strings about to be played.
    const lit = hideNotes || active.has(st.string);

    ctx.globalAlpha = lit ? 1 : 0.3;
    ctx.fillStyle = lit ? st.color : "#3f3f46";
    drawPill(pillX, top, pillW, pillH, r);
    ctx.fill();
    // Top-half sheen — same treatment as the fret pills.
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    drawPill(pillX + 1, top + 1, pillW - 2, pillH / 2 - 1, r);
    ctx.fill();

    ctx.globalAlpha = lit ? 1 : 0.6;
    // Lit pills carry the string colour, so they follow the fret-number setting;
    // dimmed ones sit on a neutral grey and keep their own readable tone.
    const litInk = fretTextColor === "auto" ? readableInk(st.color) : fretTextColor;
    ctx.fillStyle = lit ? litInk : "#d4d4d8";
    ctx.font = "bold 13px Inter, sans-serif";
    drawText(st.label, pillX + pillW / 2, y + 0.5);
  }
  ctx.globalAlpha = 1;
}

// ── Tempo-aware cursor helpers ────────────────────────────────────────────────

/** Recompute total loop duration in wall-clock seconds using the tempo map + current bpm.
 *  Must be called whenever bpm or tempoMap changes. */
function recomputeLoopSeconds(): void {
  if (tempoMap.length === 0 || totalBeats <= 0) {
    cachedLoopSeconds = bpm > 0 ? totalBeats / (bpm / 60) : 0;
    return;
  }
  let total = 0;
  for (let i = 0; i < tempoMap.length; i++) {
    const segStart = tempoMap[i].beatPos;
    const segEnd = i + 1 < tempoMap.length ? tempoMap[i + 1].beatPos : totalBeats;
    const effectBpm = tempoMap[i].ratio * bpm;
    if (effectBpm > 0) total += (segEnd - segStart) / (effectBpm / 60);
  }
  cachedLoopSeconds = total;
}

/** Given elapsed wall-clock seconds, return cumulative beats elapsed (handles looping). */
function computeBeatsElapsed(elapsed: number): number {
  if (tempoMap.length === 0) return elapsed * (bpm / 60);
  if (cachedLoopSeconds <= 0) return 0;

  const loops = Math.floor(elapsed / cachedLoopSeconds);
  let t = elapsed - loops * cachedLoopSeconds; // time within current loop

  let beatPos = 0;
  for (let i = 0; i < tempoMap.length; i++) {
    const segStart = tempoMap[i].beatPos;
    const segEnd = i + 1 < tempoMap.length ? tempoMap[i + 1].beatPos : totalBeats;
    const effectBpm = tempoMap[i].ratio * bpm;
    if (effectBpm <= 0) continue;
    const segBeats = segEnd - segStart;
    const segSeconds = segBeats / (effectBpm / 60);
    if (t <= segSeconds + 1e-9) {
      beatPos = segStart + t * (effectBpm / 60);
      break;
    }
    t -= segSeconds;
    beatPos = segEnd;
  }
  return loops * totalBeats + beatPos;
}

// ── Rest symbol ───────────────────────────────────────────────────────────────
function drawRestSymbol(x: number, dur: number) {
  if (!ctx) return;
  ctx.strokeStyle = RHYTHM_COLOR;
  ctx.fillStyle = RHYTHM_COLOR;

  if (bravuraReady) {
    // Real engraved rest glyph. Whole/half rests hang from / sit on a ledger
    // line; the shorter rests centre in the stem band.
    const g = dur >= 4 ? GLYPH_REST.whole : dur >= 2 ? GLYPH_REST.half : dur >= 1 ? GLYPH_REST.quarter
      : dur >= 0.5 ? GLYPH_REST.eighth : dur >= 0.25 ? GLYPH_REST.sixteenth : GLYPH_REST.thirtysecond;
    const ry = dur >= 4 ? RHY_HEAD_Y - RHY_GLYPH_PX * 0.3
      : dur >= 2 ? RHY_HEAD_Y - RHY_GLYPH_PX * 0.15
      : (STEM_TOP_Y + RHY_HEAD_Y) / 2 + 2;
    drawGlyph(g, x, ry, "center", "middle");
    return;
  }

  ctx.lineWidth = 1.5;

  if (dur >= 4.0) {
    // Whole rest: filled rectangle hanging below a ledger line
    const rw = 10, rh = 5;
    const ry = RHY_HEAD_Y - rh - 1;
    ctx.fillRect(x - rw / 2, ry, rw, rh);
    ctx.beginPath();
    ctx.moveTo(x - rw / 2 - 2, ry);
    ctx.lineTo(x + rw / 2 + 2, ry);
    ctx.stroke();
  } else if (dur >= 2.0) {
    // Half rest: filled rectangle sitting on a ledger line
    const rw = 10, rh = 5;
    const ry = RHY_HEAD_Y;
    ctx.fillRect(x - rw / 2, ry, rw, rh);
    ctx.beginPath();
    ctx.moveTo(x - rw / 2 - 2, ry + rh);
    ctx.lineTo(x + rw / 2 + 2, ry + rh);
    ctx.stroke();
  } else if (dur >= 1.0) {
    // Quarter rest: simplified zigzag
    const y0 = STEM_TOP_Y + 2;
    ctx.beginPath();
    ctx.moveTo(x + 2, y0);
    ctx.lineTo(x - 2, y0 + 5);
    ctx.lineTo(x + 3, y0 + 10);
    ctx.lineTo(x - 1, y0 + 15);
    ctx.bezierCurveTo(x + 5, y0 + 18, x + 4, y0 + 22, x - 2, y0 + 26);
    ctx.stroke();
  } else {
    // Eighth/sixteenth rest: diagonal slash(es) with circle flag(s)
    const flagCount = dur < 0.25 ? 2 : 1;
    for (let f = 0; f < flagCount; f++) {
      const fy = RHY_HEAD_Y - 4 - f * 9;
      ctx.beginPath();
      ctx.moveTo(x - 4, fy + 8);
      ctx.lineTo(x + 4, fy);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + 4, fy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ── Main render frame ─────────────────────────────────────────────────────────
function render() {
  rafId = requestAnimationFrame(render);
  if (!ctx || W === 0) return;

  // Covered: skip the paint but keep `needsRedraw` intact, so uncovering repaints
  // once with whatever arrived in the meantime rather than showing a stale board.
  if (!isVisible) return;

  // Labels expire here, not where they are drawn — a note scrolled out of view
  // would otherwise keep its label (and the paused repaint below) alive forever.
  const frameNow = Date.now();
  for (const [key, label] of timingLabels) {
    if (frameNow - label.at >= TIMING_LABEL_MS) timingLabels.delete(key);
  }

  // Skip paint when paused and nothing animating
  const learnAnimating = learnTarget !== null && !learnIsCalm();
  if (!isPlaying && !needsRedraw && glide === null && !learnAnimating && visual.hitTimestampsCount === 0 && timingLabels.size === 0) {
    if (lastRestActive) {
      lastRestActive = false;
      self.postMessage({ type: 'REST_ACTIVE', isRest: false });
    }
    return;
  }
  needsRedraw = false;

  // A glide moves the paused view a step closer to where it is going.
  if (glide) {
    if (isPlaying) {
      glide = null;
    } else {
      const t = Math.min(1, (frameNow - glide.start) / GLIDE_MS);
      const eased = easeOutCubic(t);
      pausedCursorPos = glide.fromCursor + (glide.toCursor - glide.fromCursor) * eased;
      pausedScrollX = glide.fromScroll + (glide.toScroll - glide.fromScroll) * eased;
      if (t >= 1) glide = null;
    }
  }

  const totalW = xMap.totalX;
  // Viewport extent in world units — the context is scaled by dpr * vscale,
  // so a stretched (or shrunk) window shows the same world height (BASE_H).
  const viewW = W / vscale;
  const viewH = H / vscale;
  // Left inset for the pinned tuning gutter — all scrolling content shifts right
  // by this much so the first notes clear the string-name labels. 0 when no gutter.
  const contentLeft = tuningStrings.length > 0 ? GUTTER_W : 0;
  let dispCursor = pausedCursorPos;     // display cursor world-x (monotonic while seamless looping)
  let scrollX = pausedScrollX;
  let beatsElapsed = 0;
  let wrappedCursor = pausedCursorPos;  // cursor within a single repetition (tile-0 space)
  let seamless = false;                 // full-exercise seamless wrap active this frame

  // The audio clock now, and the moment the streamed fills are drawn at: a
  // little behind it, so the steps around that moment are already in.
  const audioNow = audioClockNow(audioClock, performance.now());
  const fillRenderSec = audioNow !== null ? audioNow - liveFills.delaySec : null;

  if (isPlaying && countInRemaining === 0) {
    const elapsed = (audioStartSec !== null && audioNow !== null && clockFromTicks)
      ? (audioNow - audioStartSec)
      : startWallMs !== null ? (Date.now() - startWallMs) / 1000 : 0;
    beatsElapsed = computeBeatsElapsed(elapsed);

    if (loopStartBeat !== null && loopEndBeat !== null && loopEndBeat > loopStartBeat
        && beatsElapsed >= loopStartBeat) {
      // Sub-loop: keep the existing jump-back behavior within the selected range
      const loopDur = loopEndBeat - loopStartBeat;
      const relBeat = beatsElapsed - loopStartBeat;
      const loopBeat = loopStartBeat + (relBeat % loopDur);
      dispCursor = beatToX(xMap, loopBeat);
      wrappedCursor = dispCursor;
    } else {
      // Full-exercise loop: monotonic cursor + tiled score so the ribbon scrolls
      // continuously into the next repetition with no snap-back.
      seamless = totalBeats > 0;
      const pass = totalBeats > 0 ? Math.floor(beatsElapsed / totalBeats) : 0;
      wrappedCursor = totalBeats > 0 ? beatToX(xMap, beatsElapsed - pass * totalBeats) : 0;
      dispCursor = pass * totalW + wrappedCursor;
    }
    scrollX = Math.max(0, dispCursor - viewW / 4);
    lastDispCursor = dispCursor;
    lastSeamless = seamless;
    // Pause/seek anchor stays within a single repetition (tile-0 space)
    pausedCursorPos = wrappedCursor;
    pausedScrollX = Math.max(0, wrappedCursor - viewW / 4);
  }

  const viewL = scrollX - 50;
  const viewR = scrollX + viewW + 50;
  const tileStart = seamless && totalW > 0 ? Math.max(0, Math.floor(viewL / totalW)) : 0;
  const tileEnd   = seamless && totalW > 0 ? Math.floor(viewR / totalW) : 0;
  // Repetition the cursor is currently in — the one just before it is the
  // outgoing tail that should keep the previous pass's frozen hit/miss state.
  const activeTile = seamless && totalW > 0 ? Math.floor(dispCursor / totalW) : 0;
  // A wrap-triggered freeze always lands near a repetition boundary. Still in
  // the first half of a tile ⇒ the cursor just crossed in and the pass that
  // ended is the one behind; past the halfway mark ⇒ matching wrapped first
  // (zero-latency native input) and the finishing pass is this very tile.
  lastFinishedTile = seamless && totalW > 0 && dispCursor % totalW < totalW / 2
    ? activeTile - 1
    : activeTile;

  // ── Clear & translate ────────────────────────────────────────────────────
  ctx.clearRect(0, 0, viewW, viewH);
  ctx.save();
  ctx.translate(contentLeft - scrollX, 0);

  // ── Staff lines — 3 batched groups (drawn once across the viewport) ──────
  if (!hideNotes) {
    const lineL = Math.max(0, scrollX);
    const lineR = seamless ? scrollX + viewW + 10 : Math.min(totalW, scrollX + viewW + 10);
    ctx.lineWidth = 1;
    for (const grp of STAFF_LINE_GROUPS) {
      ctx.strokeStyle = withAlpha(inkColor, grp.alpha);
      ctx.beginPath();
      for (const i of grp.indices) {
        const y = STAFF_TOP + i * STRING_SPACING;
        ctx.moveTo(lineL, y); ctx.lineTo(lineR, y);
      }
      ctx.stroke();
    }
  }

  // ── Per-tile score content — one tile per visible repetition ─────────────
  // In seamless full-loop mode the score is tiled so the viewport can straddle
  // a repetition boundary; tileStart..tileEnd is 0..0 in every other case.
  for (let tile = tileStart; tile <= tileEnd; tile++) {
    const tileOff = tile * totalW;
    // Local (tile-space) viewport + cursor — shadow the outer world-space values
    const visL = viewL - tileOff;
    const visR = viewR - tileOff;
    const cursorPos = dispCursor - tileOff;
    // Outgoing tail (the repetition just behind the cursor) renders the frozen
    // previous-pass state so it stays painted instead of resetting to raw.
    // `tile < activeTile` is a hard guarantee, not an optimisation: a frozen
    // snapshot describes a pass that is over, so it may never paint the
    // repetition the cursor is currently in — that alone is what made the
    // display show the previous loop's feedback instead of the live one.
    const isOutgoing = seamless && visual.hasFrozen && tile === visual.frozenTile && tile < activeTile;
    const tileHit = isOutgoing ? visual.frozenHitNotes : visual.hitNotes;
    const tileMissed = isOutgoing ? visual.frozenMissedNotes : visual.missedNotes;
    ctx.save();
    ctx.translate(tileOff, 0);

  // ── Measure lines — single batched path ─────────────────────────────────
  if (showMeasureLines) {
    ctx.strokeStyle = withAlpha(inkColor, 0.25);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, STAFF_TOP); ctx.lineTo(0, STAFF_TOP + 5 * STRING_SPACING);
    // Binary search for first visible measure bar, then scan forward
    if (measureEndPx.length > 0) {
      let lo = 0, hi = measureEndPx.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (measureEndPx[mid] < visL) lo = mid + 1; else hi = mid;
      }
      for (let mi = lo; mi < measureEndPx.length; mi++) {
        const x = measureEndPx[mi];
        if (x > visR) break;
        ctx.moveTo(x, STAFF_TOP); ctx.lineTo(x, STAFF_TOP + 5 * STRING_SPACING);
      }
    }
    ctx.stroke();
  }

  // Track last rendered note pos per string for slide lines: string# → { x, y, slideOut }
  stringLastPos.clear();
  // Right edge of the last chord tag drawn — see the pick marks below.
  let chordTagEnd = -Infinity;

  // Binary search for first visible beat, then scan forward
  let startIdx = 0;
  if (renderBeats.length > 0) {
    let lo = 0, hi = renderBeats.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (xMap.xs[mid + 1] < visL) lo = mid + 1; else hi = mid;
    }
    startIdx = lo;
  }

  // ── Beat loop ────────────────────────────────────────────────────────────
  for (let i = startIdx; i < renderBeats.length; i++) {
    const beat = renderBeats[i];
    const beatPx = xMap.xs[i];
    const beatEndPx = xMap.xs[i + 1];
    const beatW = beatEndPx - beatPx;
    // More than xMap.beatWidth where a fast run had to be spread out.
    const pxPerBeat = beat.duration > 0 ? beatW / beat.duration : xMap.beatWidth;
    const beatL = beatPx + 10;

    if (beatL > visR) break;

    const inView = beatEndPx >= visL && beatPx <= visR;
    const isActive = isPlaying && startWallMs !== null && cursorPos >= beatPx && cursorPos < beatEndPx;
    // Pitch-detection visuals (hit / miss / progressive fill) only render once the
    // cursor has reached this beat in the current pass. Note keys carry no
    // repetition index, so without this gate a not-yet-played upcoming tile would
    // inherit the current pass's hit state. cursorPos is tile-local, so a future
    // tile has a negative local cursor and is suppressed until the cursor enters it.
    const reached = cursorPos >= beatPx;

    // Chord name first, under everything this beat draws live (timing labels,
    // hit flashes). A long name can run into the next beats' columns; their pick
    // marks then give way to it (below) instead of being drawn through its text.
    const chordTagBefore = chordTagEnd;
    if (beat.chordName && inView && showChordNames) {
      chordTagEnd = drawChordTag(beat.chordName, beatPx + CHORD_TAG_X, STAFF_TOP - BLOCK_H / 2 - CHORD_TAG_GAP - CHORD_TAG_H);
    }

    // Rhythm notation
    if (inView && showRhythmLane) {
      const dur = beat.duration;
      ctx.strokeStyle = RHYTHM_COLOR;
      ctx.fillStyle = RHYTHM_COLOR;

      if (beat.isRest) {
        const warnThisBeat = showRestWarning && isActive;
        if (warnThisBeat) {
          // Subtle amber column tint
          ctx.fillStyle = "rgba(251,191,36,0.07)";
          ctx.fillRect(beatPx, 0, beatW, viewH);
          // Override rest symbol color to amber
          ctx.strokeStyle = "rgba(251,191,36,0.9)";
          ctx.fillStyle = "rgba(251,191,36,0.9)";
        }
        drawRestSymbol(beatL, dur);
        if (warnThisBeat) {
          // Small "!" above the rest symbol
          ctx.font = "bold 11px Inter, sans-serif";
          ctx.fillStyle = "#fbbf24";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          drawText("!", beatL, STEM_TOP_Y - 8);
          // Reset colors
          ctx.strokeStyle = RHYTHM_COLOR;
          ctx.fillStyle = RHYTHM_COLOR;
        }
      } else if (dur >= 4.0) {
        // Whole note — open notehead, no stem.
        if (bravuraReady) {
          drawGlyph(GLYPH_NOTEHEAD.whole, beatL, RHY_HEAD_Y);
        } else {
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(beatL, RHY_HEAD_Y, RHY_HEAD_R * 1.5, RHY_HEAD_R, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        // Stem — shared by half, quarter and shorter notes. As in engraved music
        // it rises from the notehead's right edge, not through its middle (SMuFL
        // noteheadBlack is 1.18 staff spaces wide, a staff space is ¼ em, and the
        // stem attaches 0.168 sp above the head's centre).
        const sp = RHY_GLYPH_PX / 4;
        const stemX = bravuraReady
          ? beatL + 0.59 * sp - RHY_STEM_W / 2
          : beatL + RHY_HEAD_R - RHY_STEM_W / 2;
        ctx.lineWidth = RHY_STEM_W;
        ctx.lineCap = "butt";
        ctx.beginPath();
        ctx.moveTo(stemX, RHY_HEAD_Y - (bravuraReady ? 0.168 * sp : 0));
        ctx.lineTo(stemX, STEM_TOP_Y);
        ctx.stroke();

        if (dur >= 2.0) {
          // Half note — open notehead.
          if (bravuraReady) drawGlyph(GLYPH_NOTEHEAD.half, beatL, RHY_HEAD_Y);
          else { ctx.beginPath(); ctx.arc(beatL, RHY_HEAD_Y, RHY_HEAD_R, 0, Math.PI * 2); ctx.stroke(); }
        } else {
          // Quarter or shorter — filled notehead …
          if (bravuraReady) drawGlyph(GLYPH_NOTEHEAD.black, beatL, RHY_HEAD_Y);
          else { ctx.beginPath(); ctx.arc(beatL, RHY_HEAD_Y, RHY_HEAD_R, 0, Math.PI * 2); ctx.fill(); }

          // … and either a beam to the neighbour, or a flag for an isolated note.
          const flags = dur < 0.25 ? 3 : dur < 0.5 ? 2 : dur < 1.0 ? 1 : 0;
          const isBeamed = beat.beamRight || beat.beamRight2 || beat.prevBeamRight || beat.prevBeamRight2;
          if (flags > 0 && !isBeamed && bravuraReady) {
            // Isolated note → one real flag glyph (8th / 16th / 32nd).
            drawGlyph(GLYPH_FLAG_UP[flags] ?? GLYPH_FLAG_UP[3], stemX - RHY_STEM_W / 2, STEM_TOP_Y, "left", "alphabetic");
          } else {
            for (let f = 0; f < flags; f++) {
              const beamY = STEM_TOP_Y + f * (BEAM_H + BEAM_GAP);
              const drawRight = f === 0 ? beat.beamRight : beat.beamRight2;
              const leftBeam = f === 0 ? beat.prevBeamRight : beat.prevBeamRight2;

              if (drawRight) {
                // Spans stem to stem, covering both stems' full thickness.
                ctx.fillStyle = RHYTHM_COLOR;
                ctx.fillRect(stemX - RHY_STEM_W / 2, beamY, beatW + RHY_STEM_W, BEAM_H);
              } else if (!leftBeam) {
                ctx.strokeStyle = RHYTHM_COLOR;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(stemX, beamY);
                ctx.bezierCurveTo(stemX + 10, beamY + 3, stemX + 8, beamY + 8, stemX + 2, beamY + 12);
                ctx.stroke();
              }
            }
          }
        }
      }
    }

    // Picking direction — grouped with the technique markers, since that's what
    // it is: a hint about how to play the beat, not part of the notation itself.
    if (inView && beat.pickStroke && showTechniqueLabels && !hideNotes && beatL - PICK_W / 2 >= chordTagBefore) {
      drawPickStroke(beat.pickStroke, beatL);
    }

    // Notes
    if (inView && !hideNotes) {
      // Block coordinates — same for all notes in this beat
      const blockX = beatPx + BLOCK_PAD;
      const rawW = beatW - BLOCK_PAD - BLOCK_GAP;
      const blockW = Math.max(BLOCK_H, rawW); // min size = square pill for tiny notes
      const blockRX = blockX + blockW;         // right edge (for slide tracking)

      // Badge Y: above the topmost block in this beat
      const bendBadgeY = beat.topNoteY - BLOCK_H / 2 - 28;
      // Head centre of the beat's first palm-muted note — where its "P.M." goes.
      let palmMuteX: number | null = null;

      // A chord is one strum, so it is drawn as one thing: its fret numbers
      // stacked where it is struck, and a single box for as long as it rings
      // (see drawChordBox) — its notes get heads and no tails, whatever the
      // tail setting.
      const isChordBox = beat.notes.length >= CHORD_BOX_MIN_NOTES;
      if (isChordBox) {
        let top = Infinity;
        let bottom = -Infinity;
        let held = 0;
        let allMissed = true;
        for (const note of beat.notes) {
          top = Math.min(top, note.noteY);
          bottom = Math.max(bottom, note.noteY);
          const liveFill = reached ? liveFillOn(liveFills, note.noteKey, tile) : undefined;
          const hit = reached && (!!tileHit[note.noteKey] || !!liveFill);
          // A streamed fill is known for this frame; any other is last frame's,
          // which the heads below update.
          const fill = isOutgoing ? blockW
            : liveFill ? heldFillWidth(liveFillBeat(liveFill, fillRenderSec), beatPx, beat.offsetX, pxPerBeat, blockX, blockW)
              : (noteVisualFill.get(note.noteKey) ?? 0);
          if (hit) held = Math.max(held, fill);
          if (hit || !(reached && tileMissed[note.noteKey])) allMissed = false;
        }
        drawChordBox(blockX, blockW, top, bottom, isActive, held, allMissed ? 0.4 : 1);
      }
      // Heads sized for a tail: a chord's, or every note's with tails on.
      const headsOnly = noteTails || isChordBox;

      for (const note of beat.notes) {
        const hitVal = reached ? tileHit[note.noteKey] : undefined;
        // Streamed from the matching loop: a hit shows before React's copy of it.
        const liveFill = reached ? liveFillOn(liveFills, note.noteKey, tile) : undefined;
        const isHit = !!hitVal || !!liveFill;
        const noteTiming = isHit ? currentTiming(noteTimings[note.noteKey], liveFill) : undefined;
        const isDead = note.isDead;
        const isHarm = !!(note.harmonicType && note.harmonicType > 0);
        const dyn = hasDynamics && note.dynamics !== undefined ? note.dynamics : 1.0;
        const ghostAlpha = 1.0; // Disabled transparency for ghost notes
        // Unaccented notes step back so the accents pop — but only in a bar that
        // has accents. Dimming every bar for one accented passage made whole
        // stretches of the tab look muted.
        const accentDim = hasAccentedNotes && beat.inAccentedBar && !note.isAccented ? 0.25 : 1.0;
        const dynAlpha = hasDynamics && note.dynamics !== undefined ? 0.3 + 0.7 * dyn : 1.0;
        const missedDim = reached && !isHit && tileMissed[note.noteKey] ? 0.2 : 1.0;
        const baseAlpha = dynAlpha * accentDim * ghostAlpha * missedDim;

        const blockY = note.noteY - BLOCK_H / 2;
        // A note is drawn as a solid "head" (where you pick it, carrying the fret
        // number) plus a slimmer, translucent "tail" running along the string for
        // as long as it rings — onset and length read at a glance instead of every
        // note being one same-looking bar. With tails off ("Solid bar") the head
        // simply spans the whole block, as the tab used to draw it.
        const baseFs = 13 * fretFontScale;
        const fs = hasDynamics ? Math.max(9, Math.round(baseFs * (0.75 + 0.25 * dyn))) : Math.round(baseFs);
        const labelChars = note.fret.toString().length + (note.isGhost ? 2 : 0);
        const headW = headsOnly
          ? Math.min(blockW, Math.max(BLOCK_H, Math.ceil(labelChars * fs * 0.62 + 10)))
          : blockW;
        const tailH = Math.max(6, Math.round(BLOCK_H * 0.42));
        const tailY = note.noteY - tailH / 2;
        const tailX = blockX + headW / 2;
        const tailW = blockX + blockW - tailX;
        const hasTail = noteTails && !isChordBox && blockW - headW > 4;
        const notePath = () => {
          ctx!.beginPath();
          pillPath(blockX, blockY, headW, BLOCK_H, BLOCK_CORNER);
          if (hasTail) pillPath(tailX, tailY, tailW, tailH, tailH / 2);
        };
        // Bar mode keeps the label in the left "head" of the long block.
        const labelX = headsOnly ? blockX + headW / 2 : blockX + Math.min(blockW / 2, BLOCK_H * 0.65);
        if (note.isPalmMute && palmMuteX === null) palmMuteX = labelX;

        // ── Slide-in line ────────────────────────────────────────────────
        if (note.slideIn && note.slideIn > 0) {
          const fromY = note.slideIn === 1 ? note.noteY + 20 : note.noteY - 20;
          ctx.strokeStyle = note.color;
          ctx.globalAlpha = ghostAlpha * 0.7;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(blockX - 16, fromY);
          ctx.lineTo(blockX - 2, note.noteY);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // ── Slide line from previous block on same string ─────────────────
        const prev = stringLastPos.get(note.noteY);
        if (prev && prev.slideOut > 0) {
          ctx.strokeStyle = stringColors[note.string - 1] ?? "#fff";
          ctx.globalAlpha = 0.7;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(prev.x + 2, prev.y);
          ctx.lineTo(blockX - 2, note.noteY);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // ── Choose fill color ────────────────────────────────────────────
        let fillColor = note.color;

        // Intonation (exercises that score it): a held note's tuner follows
        // the live pitch while it rings, and its fill takes the colour of how
        // in tune it is — live first, then the grade it settled on.
        const isHeldNote = !note.isBend && !note.isRelease && !isDead;
        const liveTune = isHeldNote && livePitch?.kind === "note" && livePitch.noteKey === note.noteKey && reached && !isOutgoing
          ? livePitch
          : null;
        let tuner = noteTuners.get(note.noteKey);
        if (liveTune) {
          if (!tuner || tuner.tile !== tile) {
            tuner = { tile, cents: liveTune.cents ?? 0, lockAt: null };
            noteTuners.set(note.noteKey, tuner);
          }
          if (liveTune.cents !== null) {
            tuner.cents += (liveTune.cents - tuner.cents) * 0.3;
            if (tuner.lockAt === null && Math.abs(tuner.cents) <= TUNER_LOCK_CENTS) tuner.lockAt = frameNow;
          }
        }
        const intonationVerdict = isHeldNote ? noteTiming?.intonation : undefined;
        const finalHitColor = intonationVerdict
          ? intonationColor(intonationVerdict.grade)
          : liveTune && tuner ? intonationColorForCents(tuner.cents) : hitFill;
        // The earlier of the two hit times: React's copy lands a flush later.
        const reactHitAt = visual.hitTimestamps[note.noteKey];
        const hitAt = liveFill && liveFill.hitAt !== null && (reactHitAt === undefined || liveFill.hitAt < reactHitAt) ? liveFill.hitAt : reactHitAt;
        const isAnimatingHit = isHit && hitAt !== undefined;

        // Palm-muted notes keep their string colour — the P.M. lane under the
        // staff marks them, and a grey pill read as a disabled note.
        if (!isHit && isDead) fillColor = "#374151";
        // Active/hit notes get a lighter block instead of a white digit.
        else if (isActive || isHit) fillColor = lightenHex(note.color, 0.72);

        // ── Active glow — translucent ring behind the head ────────────────
        if (isActive && !isHit) {
          ctx.fillStyle = note.color;
          ctx.globalAlpha = ghostAlpha * 0.12;
          drawPill(blockX - 6, blockY - 6, headW + 12, BLOCK_H + 12, BLOCK_CORNER + 5);
          ctx.fill();
          ctx.globalAlpha = ghostAlpha * 0.22;
          drawPill(blockX - 3, blockY - 3, headW + 6, BLOCK_H + 6, BLOCK_CORNER + 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        // ── Learn mode — the note to play next ───────────────────────────
        if (learnTarget && !isPlaying && !isHit && learnTarget.keys.has(note.noteKey)) {
          drawLearnHalo(blockX, blockY, headW, BLOCK_H, frameNow);
        }

        // ── Draw pill block ──────────────────────────────────────────────
        let hitAge = 0;
        if (isAnimatingHit && hitAnimations) {
          hitAge = Math.min(1, (Date.now() - hitAt!) / HIT_ANIM_MS);
        }

        // Timing, shown as words and position rather than as a colour — only
        // for hits plainly off the beat (timingHintFor); any other hit looks
        // like any other hit. Late: the fill starts at the attack, leaving the
        // note's front open. Both: a short "Early"/"Late" over the note that
        // fades right away — and a hit close to the beat earns a green "+".
        const timing = timingHints ? noteTiming : undefined;
        const isOffBeat = timing?.hint === "early" || timing?.hint === "late";
        const offBeatPx = timing && isOffBeat && timing.offsetBeats !== null
          ? timing.offsetBeats * pxPerBeat
          : 0;
        const fillStartW = Math.max(0, Math.min(blockW - 2, offBeatPx));

        let fillW = 0;
        if (isHit && isOutgoing) {
          // Frozen tail strictly behind the cursor: keep notes fully filled and
          // never touch the live cache (its note key is shared with other tiles).
          fillW = blockW;
        } else if (liveFill) {
          // Streamed: drawn between the matching loop's own steps, a little
          // behind the clock (liveNoteFills.ts) — it grows at the cursor's pace
          // and stops exactly where the note stopped ringing.
          fillW = heldFillWidth(liveFillBeat(liveFill, fillRenderSec), beatPx, beat.offsetX, pxPerBeat, blockX, blockW);
        } else if (isHit) {
          // Green fills up to how far the note was actually SUSTAINED. `hitVal` is
          // the beat matching last confirmed the correct pitch still ringing — it
          // advances only while you hold the note and freezes the instant you stop,
          // so the fill stops exactly where you stopped instead of racing the cursor
          // to the end. Without a streamed fill (learn mode, hunts) this copy is
          // all there is, refreshed at ~20Hz: ease the drawn width toward it, and
          // never rewind — a hit only ever grows.
          // hitVal is a beat; past this beat's end the fill is clamped below anyway.
          const heldX = typeof hitVal === 'number' ? beatPx + (hitVal - beat.offsetX) * pxPerBeat : cursorPos;
          const targetFill = Math.max(0, Math.min(blockW, heldX - blockX));
          const prevFill = noteVisualFill.get(note.noteKey) || 0;
          fillW = Math.max(prevFill, prevFill + (targetFill - prevFill) * 0.4);
          noteVisualFill.set(note.noteKey, fillW);
        } else if (reached && !isOutgoing) {
          // Only the real (reached) live pass clears the cache; the frozen tail and
          // upcoming tiles share the same note key and must not wipe stored fill.
          noteVisualFill.delete(note.noteKey);
        }

        if (isHarm) {
          // Harmonic: outlined pill
          const col = note.harmonicType === 1 ? note.color : "#e879f9";
          ctx.globalAlpha = ghostAlpha * accentDim;
          if (hasTail) {
            ctx.fillStyle = (isHit ? hitFill : col) + "33";
            drawPill(tailX, tailY, tailW, tailH, tailH / 2);
            ctx.fill();
          }
          ctx.strokeStyle = isHit ? hitFill : col;
          ctx.lineWidth = 2;
          ctx.fillStyle = (isHit ? hitFill : col) + "22";
          drawPill(blockX, blockY, headW, BLOCK_H, BLOCK_CORNER);
          ctx.fill();
          ctx.stroke();
          ctx.globalAlpha = 1;

          // Progressive fill for harmonic
          if (fillW > 0) {
            ctx.save();
            notePath();
            ctx.clip();
            ctx.fillStyle = withAlpha(hitFill, 0.4);
            ctx.fillRect(blockX + fillStartW, blockY, Math.max(0, fillW - fillStartW), BLOCK_H);
            ctx.restore();
          }

        } else {
          const alpha = isHit ? 1.0 : baseAlpha;

          // Sustain tail: the string's colour, dimmed so the head stays the
          // thing your eye lands on. Dead notes keep their grey.
          if (hasTail) {
            ctx.globalAlpha = alpha * (isActive ? 0.6 : 0.38);
            ctx.fillStyle = isDead ? fillColor : note.color;
            drawPill(tailX, tailY, tailW, tailH, tailH / 2);
            ctx.fill();
          }

          ctx.globalAlpha = alpha;
          ctx.fillStyle = fillColor;

          // Glow behind the head for fresh hits
          if (isAnimatingHit && hitAnimations && hitAge < 0.55) {
            const glowStr = 1 - hitAge / 0.55;
            const glow = hitGlowSprite(headW);
            if (glow) {
              const s = dpr * vscale;
              ctx.globalAlpha = alpha * glowStr;
              ctx.drawImage(glow, blockX - HIT_GLOW_PAD / s, blockY - HIT_GLOW_PAD / s, glow.width / s, glow.height / s);
              ctx.globalAlpha = alpha;
            } else {
              ctx.shadowColor = hitGlow;
              ctx.shadowBlur = glowStr * HIT_GLOW_BLUR;
            }
          }

          drawPill(blockX, blockY, headW, BLOCK_H, BLOCK_CORNER);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Solid bar keeps its original sheen: a lighter strip on the top half.
          if (!headsOnly && !isDead) {
            ctx.fillStyle = "rgba(255,255,255,0.14)";
            drawPill(blockX + 1, blockY + 1, blockW - 2, BLOCK_H / 2 - 1, BLOCK_CORNER);
            ctx.fill();
          }

          // Progressive filling with green tied to the playback cursor
          if (fillW > 0) {
            ctx.save();
            notePath();
            ctx.clip();
            
            // The solid green fill — from where the note was played on
            ctx.fillStyle = finalHitColor;
            ctx.fillRect(blockX + fillStartW, blockY, Math.max(0, fillW - fillStartW), BLOCK_H);
            
            // White shining leading edge of the fill
            const sweepW = 12;
            const sweepX = blockX + fillW - sweepW;
            if (sweepX > blockX - sweepW && fillW < blockW) {
              const sweepGrad = ctx.createLinearGradient(sweepX, 0, sweepX + sweepW, 0);
              sweepGrad.addColorStop(0, "rgba(255,255,255,0)");
              sweepGrad.addColorStop(1, "rgba(255,255,255,0.85)");
              ctx.fillStyle = sweepGrad;
              ctx.fillRect(sweepX, blockY, sweepW, BLOCK_H);
            }

            ctx.restore();
          }

          ctx.globalAlpha = 1;

          // Dead note X over the pill
          if (isDead) {
            ctx.strokeStyle = isActive ? "#94a3b8" : "#6b7280";
            ctx.lineWidth = 2.5;
            const xr = 6, cx = labelX;
            ctx.beginPath();
            ctx.moveTo(cx - xr, note.noteY - xr); ctx.lineTo(cx + xr, note.noteY + xr);
            ctx.moveTo(cx + xr, note.noteY - xr); ctx.lineTo(cx - xr, note.noteY + xr);
            ctx.stroke();
          }
        }

        // ── Timing label over the note, fading right away ─────────────────
        // "Early"/"Late" in the board's ink, a dead-on "+" in the hit colour.
        // One label per beat: a chord's notes share one attack, so only its top
        // note speaks for it.
        const timingLabel = isHit && timingHints && note.noteY === beat.topNoteY
          ? timingLabels.get(note.noteKey)
          : undefined;
        if (timingLabel) {
          const age = Math.min(1, (frameNow - timingLabel.at) / TIMING_LABEL_MS);
          const isPerfect = timingLabel.kind === "perfect";
          ctx.save();
          ctx.globalAlpha = 0.9 * (1 - age * age);
          ctx.fillStyle = isPerfect ? hitGlow : inkColor;
          ctx.font = isPerfect ? "700 15px Inter, sans-serif" : "600 11px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          drawText(
            isPerfect ? "+" : timingLabel.kind === "early" ? "Early" : "Late",
            blockX + headW / 2,
            blockY - 4 - age * 6,
          );
          ctx.restore();
        }

        // ── Early / late arrow under the note, for the rest of the pass ─────
        if (offBeatPx !== 0 && note.noteY === beat.topNoteY) {
          drawTimingArrow(blockX + headW / 2, blockY + BLOCK_H + 7, offBeatPx < 0, timing!.grade <= 1);
        }

        // ── Note tuner while it rings, then the verdict if it was off ───────
        if (liveTune && tuner && !intonationVerdict) {
          const lockAge = tuner.lockAt !== null ? (frameNow - tuner.lockAt) / BEND_LOCK_PULSE_MS : null;
          drawNoteTuner(blockX + headW / 2, blockY - 4, tuner.cents, lockAge);
        } else if (intonationVerdict && intonationVerdict.grade < 3 && intonationVerdict.cents !== null) {
          drawIntonationVerdict(blockX + headW / 2, blockY - 5, intonationVerdict.grade, intonationVerdict.cents);
        }

        // ── Bend gauge: how far the string has been bent, live ──────────────
        if ((note.isBend && !note.isPreBend) || note.isRelease) {
          const kind = note.isRelease ? "release" : "bend";
          const live = livePitch && livePitch.noteKey === note.noteKey && reached && !isOutgoing ? livePitch : null;
          let gauge = bendGauges.get(note.noteKey);
          if (live) {
            // A note played again in a new pass starts its gauge over.
            if (!gauge || gauge.tile !== tile) {
              gauge = { tile, amount: 0, locked: false, lockAt: 0 };
              bendGauges.set(note.noteKey, gauge);
            }
            if (live.amount !== null) {
              gauge.amount += (live.amount - gauge.amount) * 0.35;
              if (!gauge.locked && live.amount >= 0.85 && live.cents !== null && Math.abs(live.cents) <= BEND_LOCK_CENTS) {
                gauge.locked = true;
                gauge.lockAt = frameNow;
              }
            }
          }
          if (gauge && gauge.tile === tile && reached && !isOutgoing) {
            const x0 = blockX + headW + 3;
            const w = Math.max(26, Math.min(56, blockW - headW - 10));
            const verdict = noteTiming?.intonation ?? null;
            const lockAge = gauge.locked ? (frameNow - gauge.lockAt) / BEND_LOCK_PULSE_MS : null;
            // Locked in or graded in tune → the hit green; graded off → the
            // board's ink; still on its way → the string's own colour.
            const color = verdict
              ? intonationColor(verdict.grade)
              : gauge.locked ? hitFill : note.color;
            drawBendGauge(kind, x0, blockY + 2, w, 26, gauge.amount, color, lockAge, verdict);
            if (lockAge !== null && lockAge < 1) needsRedraw = true;
          }
        }

        // ── Hit animation (Block Shockwave + Sweet Flash) ───────────────────────
        if (isAnimatingHit && hitAnimations) {
          const eased = 1 - (1 - hitAge) * (1 - hitAge); // Quad ease-out

          // White flash over whole pill at start
          if (hitAge < 0.2) {
            const flashA = (1 - hitAge / 0.2) * 0.7;
            ctx.globalAlpha = flashA;
            ctx.fillStyle = "#ffffff";
            notePath();
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          // Shockwave 1 — head outline expanding outwards
          const exp1 = eased * 8; // expands by 8px
          const a1 = (1 - hitAge) * 0.8;
          ctx.strokeStyle = withAlpha(hitGlow, a1);
          ctx.lineWidth = Math.max(0.5, 3 * (1 - hitAge));
          drawPill(blockX - exp1, blockY - exp1, headW + exp1 * 2, BLOCK_H + exp1 * 2, BLOCK_CORNER + exp1);
          ctx.stroke();

          // Shockwave 2 — delayed, smaller outline
          if (hitAge > 0.15) {
            const age2 = (hitAge - 0.15) / 0.85;
            const eased2 = 1 - (1 - age2) * (1 - age2);
            const exp2 = eased2 * 5;
            const a2 = (1 - age2) * 0.4;
            ctx.strokeStyle = withAlpha(hitFill, a2);
            ctx.lineWidth = Math.max(0.5, 2 * (1 - age2));
            drawPill(blockX - exp2, blockY - exp2, headW + exp2 * 2, BLOCK_H + exp2 * 2, BLOCK_CORNER + exp2);
            ctx.stroke();
          }

          if (hitAge >= 1) { delete visual.hitTimestamps[note.noteKey]; visual.hitTimestampsCount--; }
        }

        // ── Fret label ────────────────────────────────────────────────────
        if (!isDead) {
          // "auto" reads the pill's own colour, so a dark palette gets light digits.
          ctx.fillStyle = fretTextColor === "auto" ? readableInk(note.color) : fretTextColor;
          ctx.font = fretFont(fs);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          let text = note.fret.toString();
          if (note.isGhost) text = `(${text})`;
          drawText(text, labelX, note.noteY);
        }

        // ── Technique labels ──────────────────────────────────────────────
        // Turned off as a group: skip every marker but still record this block
        // for the next note's slide line, which is note geometry, not a label.
        if (!showTechniqueLabels) {
          stringLastPos.set(note.noteY, { x: blockRX, cx: blockX + headW / 2, y: note.noteY, slideOut: note.slideOut ?? 0 });
          continue;
        }
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // Set by the first label that needs the small font (or by H/P, whose
        // larger font the tap "T" has always inherited).
        let labelFontSet = false;
        if (note.isAccented) {
          ctx.font = TECHNIQUE_FONT;
          labelFontSet = true;
          ctx.fillStyle = withAlpha(inkColor, 0.75);
          drawText(">", labelX, blockY - 6);
        }
        if (note.isHammerOn || note.isPullOff) {
          const isHP = note.isHammerOn;
          const hpColor = isHit ? "#34d399" : note.color;
          const label = isHP ? "H" : "P";

          if (prev && blockX - prev.x > 4) {
            // Draw slur arc from centre of previous block to centre of this block
            const x0 = prev.cx;
            const x1 = blockX + headW / 2;
            const midX = (x0 + x1) / 2;
            const slurY = note.noteY - BLOCK_H / 2 + 1;
            const arcH = Math.min(28, Math.max(16, (x1 - x0) * 0.4));

            ctx.strokeStyle = hpColor;
            ctx.lineWidth = 3;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(x0, slurY);
            ctx.quadraticCurveTo(midX, slurY - arcH, x1, slurY);
            ctx.stroke();

            // Label at apex of arc
            ctx.fillStyle = hpColor;
            ctx.font = "bold 12px Inter";
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            drawText(label, midX, slurY - arcH - 3);
          } else {
            // No previous note visible – fallback to label above block
            ctx.fillStyle = hpColor;
            ctx.font = "bold 12px Inter";
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            drawText(label, labelX, blockY - 3);
          }
          labelFontSet = true;
        }
        if (note.isTap) {
          if (!labelFontSet) ctx.font = TECHNIQUE_FONT;
          ctx.fillStyle = isHit ? "#064e3b" : "#34d399";
          drawText("T", blockRX - 7, blockY - 6);
        }

        // Harmonic badge
        if (isHarm) {
          ctx.font = "bold 8px Inter";
          ctx.fillStyle = note.harmonicType === 1 ? "#a3e635" : "#f0abfc";
          const hLabel = note.harmonicType === 1 ? "N.H." : note.harmonicType === 2 ? "A.H."
            : note.harmonicType === 3 ? "T.H." : note.harmonicType === 4 ? "P.H." : "S.H.";
          drawText(hLabel, labelX, note.noteY);
        }

        // Staccato: dot above block
        if (note.isStaccato) {
          ctx.fillStyle = isHit ? "#10b981" : note.color;
          ctx.beginPath();
          ctx.arc(labelX, blockY - 7, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Let ring: dashed line extending past block right edge
        if (note.isLetRing) {
          const trailEnd = Math.min(blockRX + 60, blockRX + beatW * 1.5);
          ctx.strokeStyle = note.color;
          ctx.globalAlpha = 0.35;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(blockRX + 2, note.noteY);
          ctx.lineTo(trailEnd, note.noteY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        }

        // Bend / pre-bend / release badge
        if (note.isBend || note.isPreBend || note.isRelease) {
          const bLabel = note.isBend
            ? (note.bendSemitones === 2 ? "full" : note.bendSemitones === 1 ? "½"
              : note.bendSemitones ? `${note.bendSemitones / 2}` : "")
            : note.isPreBend ? "PB" : "R";
          const bIcon = note.isRelease ? "\u2193" : "\u2191";
          const bgCol = note.isBend ? (isHit ? "#064e3b" : "#7e22ce")
            : note.isPreBend ? (isHit ? "#064e3b" : "#4c1d95")
              : (isHit ? "#064e3b" : "#312e81");
          const txCol = note.isBend ? (isHit ? "#34d399" : "#f0abfc")
            : note.isPreBend ? (isHit ? "#34d399" : "#ddd6fe")
              : (isHit ? "#34d399" : "#c7d2fe");
          // Pass blockY (top edge) so connector line ends at block top
          drawBendBadge(bLabel, bIcon, bgCol, txCol, labelX, bendBadgeY, blockY);
        }

        // Vibrato – a wave running along the sustain tail (the part of the note
        // you actually shake); a tail-less note gets a short wave above its head.
        if (note.isVibrato) {
          const vibratoColor = isHit ? "#34d399" : note.color;
          const x0 = hasTail ? blockX + headW + 3 : blockX;
          const x1 = hasTail ? blockRX - 3 : blockX + headW;
          const y = hasTail ? note.noteY : blockY - 5;
          const len = x1 - x0;
          if (len > 4) {
            const amp = hasTail ? tailH / 2 + 1.5 : 2;
            const cycles = Math.max(1, Math.round(len / 9));
            const vstep = 2;

            ctx.strokeStyle = vibratoColor;
            ctx.lineWidth = 2;
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(x0, y);
            for (let i = vstep; i < len; i += vstep) {
              ctx.lineTo(x0 + i, y + Math.sin((i / len) * Math.PI * 2 * cycles) * amp);
            }
            ctx.lineTo(x1, y);
            ctx.stroke();
          }
        }

        // ── Update slide tracking (right edge of block) ───────────────────
        stringLastPos.set(note.noteY, { x: blockRX, cx: blockX + headW / 2, y: note.noteY, slideOut: note.slideOut ?? 0 });
      }

      if (palmMuteX !== null && showTechniqueLabels) {
        drawPalmMuteLabel(palmMuteX, beatW, isActive);
      }
    }
  }

  // ── Time signature markers ───────────────────────────────────────────────
  if (timeSigMarkers.length > 0) {
    const sigMidY = STAFF_TOP + STRING_SPACING * 2.5;
    ctx.fillStyle = withAlpha(inkColor, 0.45);
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Markers run left to right: find the first in view, stop past the last.
    let lo = 0, hi = timeSigMarkers.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (beatToX(xMap, timeSigMarkers[mid].x) + 10 < visL - 40) lo = mid + 1; else hi = mid;
    }
    for (let mi = lo; mi < timeSigMarkers.length; mi++) {
      const marker = timeSigMarkers[mi];
      const mx = beatToX(xMap, marker.x) + 10;
      if (mx > visR) break;
      drawText(marker.sig[0].toString(), mx, sigMidY - 10);
      drawText(marker.sig[1].toString(), mx, sigMidY + 10);
    }
  }

  // ── Tuplet brackets ──────────────────────────────────────────────────────
  if (tupletGroups.length > 0) {
    const bracketY = STEM_TOP_Y - 7;
    const tickH = 5;
    ctx.strokeStyle = RHYTHM_COLOR;
    ctx.fillStyle = RHYTHM_COLOR;
    ctx.lineWidth = 1.2;
    ctx.font = "bold 8px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Groups follow each other without overlapping, so both ends run left to
    // right: find the first that reaches into view, stop past the last.
    let lo = 0, hi = tupletGroups.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (beatToX(xMap, tupletGroups[mid].x2) - 8 < visL) lo = mid + 1; else hi = mid;
    }
    for (let gi = lo; gi < tupletGroups.length; gi++) {
      const group = tupletGroups[gi];
      const x1 = beatToX(xMap, group.x1) + 8;
      const x2 = beatToX(xMap, group.x2) - 8;
      if (x1 > visR) break;
      const midX = (x1 + x2) / 2;
      const label = group.num.toString();
      let numW = tupletLabelWidths.get(group.num);
      if (numW === undefined) {
        numW = ctx.measureText(label).width;
        tupletLabelWidths.set(group.num, numW);
      }
      const lw = numW + 6;
      // Left arm
      ctx.beginPath();
      ctx.moveTo(x1, bracketY + tickH);
      ctx.lineTo(x1, bracketY);
      ctx.lineTo(midX - lw / 2, bracketY);
      ctx.stroke();
      // Right arm
      ctx.beginPath();
      ctx.moveTo(midX + lw / 2, bracketY);
      ctx.lineTo(x2, bracketY);
      ctx.lineTo(x2, bracketY + tickH);
      ctx.stroke();
      // Number
      drawText(label, midX, bracketY);
    }
  }

    ctx.restore();
  } // end per-tile loop

  // ── Progress overlay — played notes fade out into the backdrop to the left ──
  // A left→right gradient over the already-played span: near-opaque at the left
  // edge (notes dissolve into the #09090b viewer background as they scroll off)
  // easing to fully transparent at the cursor, so the note just played stays
  // perfectly readable and only the older notes disappear. Fill only the visible
  // span (viewL..dispCursor) so the rect can't grow unbounded as the monotonic
  // cursor advances across repetitions.
  if (dispCursor > 0) {
    const fade = ctx.createLinearGradient(viewL, 0, dispCursor, 0);
    fade.addColorStop(0,    withAlpha(bgColor, 0.98));
    fade.addColorStop(0.3,  withAlpha(bgColor, 0.82));
    fade.addColorStop(0.7,  withAlpha(bgColor, 0.4));
    fade.addColorStop(1,    withAlpha(bgColor, 0));
    ctx.fillStyle = fade;
    ctx.fillRect(viewL, 0, dispCursor - viewL, viewH);
  }

  // ── Loop range overlay ────────────────────────────────────────────────────
  if (loopStartBeat !== null && loopEndBeat !== null && loopEndBeat > loopStartBeat) {
    const lsx = beatToX(xMap, loopStartBeat);
    const lex = beatToX(xMap, loopEndBeat);

    // Dim the areas outside the loop range
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(0, 0, lsx, viewH);
    ctx.fillRect(lex, 0, totalW - lex, viewH);

    // Loop boundary lines
    ctx.strokeStyle = "rgba(6,182,212,0.65)";
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(lsx, 0); ctx.lineTo(lsx, viewH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lex, 0); ctx.lineTo(lex, viewH); ctx.stroke();

    // Small label at the start boundary
    ctx.fillStyle = "rgba(6,182,212,0.55)";
    ctx.font = "bold 9px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    drawText("⟳", lsx + 4, 3);
  }

  // ── Editor selection — mirrors the cell(s) picked in the tab editor grid ─
  // Playback owns the board while it runs, so this only shows when stopped.
  if (selection && !isPlaying) {
    const selX = beatToX(xMap, selection.startBeat);
    const selW = Math.max(6, beatToX(xMap, selection.endBeat) - selX);
    // Flipped staff swaps which end of the string range is the upper row.
    const selRows = [stringRow(selection.startString, flipStrings), stringRow(selection.endString, flipStrings)];
    const topY = STAFF_TOP + Math.min(...selRows) * STRING_SPACING;
    const botY = STAFF_TOP + Math.max(...selRows) * STRING_SPACING;

    // Wash over the whole staff at that beat: an empty cell has no note to ring,
    // and this is what makes the spot findable at a glance.
    ctx.fillStyle = "rgba(6,182,212,0.10)";
    ctx.fillRect(selX, STAFF_TOP - 16, selW, 5 * STRING_SPACING + 32);

    // Ring around the selected string(s) — the note-level "you are here".
    ctx.strokeStyle = "rgba(34,211,238,0.85)";
    ctx.lineWidth = 1.5;
    drawPill(selX - 2, topY - BLOCK_H / 2 - 3, selW + 4, botY - topY + BLOCK_H + 6, BLOCK_CORNER + 2);
    ctx.stroke();
  }

  // ── Hover seek preview — dashed line at measure snap point ───────────────
  if (hoverStartX !== null && !isPlaying) {
    // Dashed vertical line showing where cursor would jump to
    ctx.strokeStyle = "rgba(6,182,212,0.5)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(hoverStartX, 0);
    ctx.lineTo(hoverStartX, viewH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Small play-triangle indicator at the top of the line
    const tx = hoverStartX + 3;
    const ty = 6;
    ctx.fillStyle = "rgba(6,182,212,0.75)";
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + 9, ty + 6);
    ctx.lineTo(tx, ty + 12);
    ctx.closePath();
    ctx.fill();

    // Measure number label
    let measureIdx = 0;
    for (let i = 0; i < measureEndPx.length; i++) {
      if (measureEndPx[i] > hoverStartX + 1) { measureIdx = i; break; }
      measureIdx = i + 1;
    }
    ctx.fillStyle = "rgba(6,182,212,0.65)";
    ctx.font = "bold 10px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    drawText(`M${measureIdx + 1}`, tx + 12, ty + 1);
  }

  // ── Learn mode — the beat to play, lit from top to bottom ────────────────
  // The column opens out from the cursor when the target moves on, and breathes
  // with the halo on the note, so the eye is led to what has to be played.
  const isLearning = learnTarget !== null && !isPlaying;
  if (learnTarget && isLearning) {
    const calm = learnIsCalm();
    const settle = calm ? 1 : easeOutCubic(Math.min(1, (frameNow - learnTarget.since) / LEARN_SETTLE_MS));
    const breathe = calm ? 0.5 : 0.5 + 0.5 * Math.sin(frameNow / 260);
    const colX = beatToX(xMap, learnTarget.beatStart);
    const colW = beatToX(xMap, learnTarget.beatStart + Math.min(1, learnTarget.beatEnd - learnTarget.beatStart)) - colX;
    const wash = ctx.createLinearGradient(0, 0, 0, viewH);
    wash.addColorStop(0, withAlpha(LEARN_COLOR, 0));
    wash.addColorStop(0.5, withAlpha(LEARN_COLOR, 0.06 + 0.05 * breathe));
    wash.addColorStop(1, withAlpha(LEARN_COLOR, 0));
    ctx.fillStyle = wash;
    ctx.fillRect(colX, 0, colW * settle, viewH);
  }

  // ── Cursor line + beat pulse ─────────────────────────────────────────────
  if (dispCursor > 0 || isPlaying) {
    // Learn mode keeps no time, so the stopped-red of a paused cursor would say
    // something it isn't: it rests on the target instead.
    ctx.strokeStyle = isPlaying ? "#06b6d4" : isLearning ? withAlpha(LEARN_COLOR, 0.6) : "#ef4444";
    ctx.lineWidth = isLearning ? 2 : 3;
    ctx.beginPath();
    ctx.moveTo(dispCursor, 0); ctx.lineTo(dispCursor, viewH);
    ctx.stroke();

    if (isPlaying && beatsElapsed > 0) {
      const bp = beatsElapsed % 1;
      if (bp < 0.3) {
        const ripple = bp * 100;
        const opacity = 1 - bp / 0.3;
        ctx.strokeStyle = `rgba(6,182,212,${opacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(dispCursor, viewH / 2, ripple, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  ctx.restore();

  // ── Pinned tuning gutter (drawn on top of the scrolled content) ──────────
  // Light the strings at / just ahead of the cursor. wrappedCursor is tile-0
  // pixel space, so the map turns it back into the cursor beat.
  drawTuningGutter(activeTuningStrings(xToBeat(xMap, wrappedCursor)));

  // ── Notify main thread when cursor enters/leaves a rest beat ────────────
  if (isPlaying && countInRemaining === 0) {
    // Beats follow each other without gaps or overlap, so the cursor is in the
    // last one that starts at or before it — if it hasn't ended yet.
    let lo = 0, hi = renderBeats.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (xMap.xs[mid] <= wrappedCursor) lo = mid + 1; else hi = mid;
    }
    const under = lo > 0 ? renderBeats[lo - 1] : undefined;
    const restActive = !!under && under.isRest && wrappedCursor < xMap.xs[lo];
    if (restActive !== lastRestActive) {
      lastRestActive = restActive;
      self.postMessage({ type: 'REST_ACTIVE', isRest: restActive });
    }
  } else if (lastRestActive) {
    lastRestActive = false;
    self.postMessage({ type: 'REST_ACTIVE', isRest: false });
  }
}

// ── Message handler ───────────────────────────────────────────────────────────
self.onmessage = (e: MessageEvent) => {
  const msg = e.data as { type: string;[k: string]: any };
  needsRedraw = true; // any incoming message requires at least one repaint

  switch (msg.type) {
    case 'INIT': {
      canvas = msg.canvas as OffscreenCanvas;
      dpr = msg.dpr ?? 1;
      W = msg.width ?? 0;
      H = msg.height ?? 256;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      vscale = H > 0 ? H / BASE_H : 1;
      ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
      ctx.setTransform(dpr * vscale, 0, 0, dpr * vscale, 0, 0);
      relayout();
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(render);
      break;
    }
    case 'RESIZE': {
      dpr = msg.dpr ?? dpr;
      W = msg.width;
      H = msg.height;
      vscale = H > 0 ? H / BASE_H : 1;
      if (canvas) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
        ctx.setTransform(dpr * vscale, 0, 0, dpr * vscale, 0, 0);
      }
      relayout();
      break;
    }
    case 'DATA': {
      renderBeats = msg.renderBeats;
      measureEndXs = msg.measureEndXs;
      totalBeats = msg.totalBeats;
      hasAccentedNotes = msg.hasAccentedNotes;
      hasDynamics = msg.hasDynamics;
      timeSigMarkers = msg.timeSigMarkers ?? [];
      tupletGroups = msg.tupletGroups ?? [];
      tempoMap = msg.tempoMap ?? [];
      pausedCursorPos = 0;
      pausedScrollX = 0;
      glide = null;
      loopStartBeat = null;
      loopEndBeat   = null;
      relayout();
      resetFrozenNoteState(visual);
      recomputeLoopSeconds();
      break;
    }
    case 'PLAYBACK': {
      isPlaying = msg.isPlaying;
      startWallMs = msg.startWallMs;
      bpm = msg.bpm;
      countInRemaining = msg.countInRemaining;
      audioStartSec = msg.audioStartSec ?? null;
      if (!isPlaying) { resetAudioClock(audioClock); clockFromTicks = false; livePitch = null; }
      if (isPlaying) { hoverStartX = null; glide = null; } // clear hover when playback starts
      recomputeLoopSeconds();
      break;
    }
    case 'HOVER': {
      hoverStartX = msg.startX ?? null;
      break;
    }
    case 'SELECTION': {
      selection = msg.selection ?? null;
      break;
    }
    case 'LOOP_RANGE': {
      loopStartBeat = msg.startBeat ?? null;
      loopEndBeat   = msg.endBeat   ?? null;
      break;
    }
    case 'TICK': {
      if (!clockFromTicks) { resetAudioClock(audioClock); clockFromTicks = true; }
      observeAudioClock(audioClock, msg.audioCurrentSec, performance.now());
      livePitch = msg.pitch ?? null;
      break;
    }
    case 'FILL_STEPS': {
      const steps = msg.steps as FillStep[];
      const wallMs = performance.now();
      if (!clockFromTicks) for (const step of steps) observeAudioClock(audioClock, step.audioSec, wallMs);
      const now = Date.now();
      const hits = addFillSteps(liveFills, steps, liveFillTile, now, audioClockNow(audioClock, wallMs));
      // The hit's Early/Late label goes up with the hit, not a flush later.
      if (timingHints) {
        for (const hit of hits) {
          if (hit.timing?.hint) timingLabels.set(hit.noteKey, { kind: hit.timing.hint, at: now });
        }
      }
      needsRedraw = true;
      break;
    }
    case 'FILL_RESET': {
      clearLiveFills(liveFills);
      needsRedraw = true;
      break;
    }
    case 'HIT_NOTES': {
      applyHitNotes(visual, msg.hitNotes as Record<string, boolean>, Date.now(), lastFinishedTile);
      break;
    }
    case 'NOTE_TIMINGS': {
      const next = msg.noteTimings as typeof noteTimings;
      const now = Date.now();
      // Compared by value: every message arrives as freshly cloned objects.
      // A note hit again in a later pass with a new timing gets a new label.
      for (const key of Object.keys(next)) {
        if (!timingHints) break;
        const t = next[key];
        const prev = noteTimings[key];
        if (!t.hint) continue;
        if (prev && prev.hint === t.hint && prev.offsetBeats === t.offsetBeats) continue;
        // Already put up when the hit streamed in.
        if (isLiveTiming(liveFills.byKey.get(key), t)) continue;
        timingLabels.set(key, { kind: t.hint, at: now });
      }
      noteTimings = next;
      break;
    }
    case 'MISSED_NOTES': {
      applyMissedNotes(visual, msg.missedNotes as Record<string, boolean>, lastFinishedTile);
      needsRedraw = true;
      break;
    }
    case 'HIDE_NOTES': {
      hideNotes = msg.hideNotes;
      break;
    }
    case 'TUNING': {
      tuningStrings = (msg.strings as TuningStringInfo[]) ?? [];
      break;
    }
    case 'LEARN': {
      const target = msg.target as { noteKeys: string[]; beatStart: number; beatEnd: number } | null;
      reducedMotion = !!msg.reducedMotion;
      learnTarget = target
        ? { keys: new Set(target.noteKeys), beatStart: target.beatStart, beatEnd: target.beatEnd, since: Date.now() }
        : null;
      break;
    }
    case 'SCROLL': {
      if (msg.smooth && !isPlaying && !learnIsCalm()) {
        // From wherever the view is right now, so a seek mid-glide carries on from there.
        glide = { fromCursor: pausedCursorPos, fromScroll: pausedScrollX, toCursor: msg.cursorPos, toScroll: msg.scrollX, start: Date.now() };
      } else {
        glide = null;
        pausedScrollX = msg.scrollX;
        pausedCursorPos = msg.cursorPos;
      }
      break;
    }
    case 'ZOOM': {
      const next = msg.zoom ?? 1;
      if (next !== zoom && next > 0) {
        zoom = next;
        relayout();
      }
      break;
    }
    case 'STYLE': {
      // Every user-facing tablature look setting arrives here as one patch.
      // Paused frames are skipped unless something changed, so flag a redraw —
      // otherwise a new setting wouldn't appear until playback resumed.
      if (msg.pillHeight !== undefined) BLOCK_H = msg.pillHeight;
      if (msg.pillCorner !== undefined) BLOCK_CORNER = msg.pillCorner;
      if (msg.noteTails !== undefined) noteTails = msg.noteTails;
      if (msg.fretFontScale !== undefined) fretFontScale = msg.fretFontScale;
      if (msg.stringColors !== undefined) stringColors = msg.stringColors;
      if (msg.hitFill !== undefined) hitFill = msg.hitFill;
      if (msg.hitGlow !== undefined) hitGlow = msg.hitGlow;
      if (msg.background !== undefined) bgColor = msg.background;
      if (msg.stringSpacing !== undefined) STRING_SPACING = msg.stringSpacing;
      if (msg.flipStrings !== undefined) flipStrings = msg.flipStrings;
      if (msg.rightToLeft !== undefined) rightToLeft = msg.rightToLeft;
      if (msg.fretText !== undefined) fretTextColor = msg.fretText;
      if (msg.ink !== undefined) {
        inkColor = msg.ink;
        // Cached string rather than a per-draw call — the rhythm lane paints it
        // dozens of times per frame.
        RHYTHM_COLOR = withAlpha(inkColor, 0.6);
        PICK_COLOR = withAlpha(inkColor, 0.65);
      }
      if (msg.showRhythmLane !== undefined) showRhythmLane = msg.showRhythmLane;
      if (msg.showChordNames !== undefined) showChordNames = msg.showChordNames;
      if (msg.showMeasureLines !== undefined) showMeasureLines = msg.showMeasureLines;
      if (msg.showTechniqueLabels !== undefined) showTechniqueLabels = msg.showTechniqueLabels;
      if (msg.hitAnimations !== undefined) hitAnimations = msg.hitAnimations;
      if (msg.timingHints !== undefined) {
        timingHints = msg.timingHints;
        if (!timingHints) timingLabels.clear();
      }
      // The pill size sets how much room a fast run needs.
      if (msg.pillHeight !== undefined || msg.fretFontScale !== undefined) relayout();
      needsRedraw = true;
      break;
    }
    case 'SHOW_REST_WARNING': {
      showRestWarning = msg.show;
      break;
    }
    case 'RESET': {
      pausedScrollX = 0;
      pausedCursorPos = 0;
      glide = null;
      showRestWarning = false;
      // Clears hitNotes too (not just missedNotes) — leaving old hits behind
      // made previously-played notes stay lit green after a restart, even
      // though the score/game state had already been reset back to zero.
      resetNoteHitVisualState(visual);
      clearLiveFills(liveFills);
      noteTimings = {};
      timingLabels.clear();
      bendGauges.clear();
      noteTuners.clear();
      livePitch = null;
      // loop range is intentionally NOT cleared here so it survives loop restarts
      break;
    }
    case 'VISIBLE': {
      isVisible = msg.visible !== false;
      break;
    }
    case 'STOP': {
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      break;
    }
  }
};
