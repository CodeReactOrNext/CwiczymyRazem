/// <reference lib="webworker" />

import type { FillStep } from "../utils/fillFeed";
import type { NoteTiming } from "../utils/timingGrade";
import type { BeatCount } from "./beatCounting";
import { beatCountLabels, beatTickPositions } from "./beatCounting";
import { createFramePace, observeFrame, resetFramePace } from "./framePace";
import { addFillSteps, clearLiveFills, createLiveFills, currentTiming, isLiveTiming, liveFillDrawnBeat, liveFillOn } from "./liveNoteFills";
import { applyHitNotes, applyHitPatch, applyMissedNotes, applyMissedPatch, createNoteHitVisualState, resetFrozenNoteState, resetNoteHitVisualState } from "./noteHitVisualState";
import type { PalmMuteRun } from "./palmMuteRuns";
import { palmMuteRuns } from "./palmMuteRuns";
import { staffLineWidth, stringRow } from "./tablatureStringRows";
import { pagedScrollX, pageStarts } from "./tabPaging";
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
// Lines on the staff — 4 for a bass tab. Driven by STYLE together with a
// STRING_SPACING spread so the staff keeps its height (staffLineSpacing), which
// is why everything sized by 5 * STRING_SPACING below needs no count.
let stringCount = 6;
// Mirrored board (music running right to left). The flip itself is a CSS
// transform on the canvas element — the worker only needs to know about it so
// the text it draws does not come out backwards (see drawText).
let rightToLeft = false;
// The standing board: the tab holds still a page at a time and the cursor
// crosses it (see tabPaging.ts), instead of sliding under a fixed cursor.
let pagedScroll = false;
// Width (world px) of the pinned left "tuning gutter" that shows each string's
// tuned note. Content is inset by this much when tuning data is present so the
// first notes don't hide behind the labels. Keep in sync with TAB_GUTTER_W in
// useTablatureWorkerBridge.ts.
const GUTTER_W = 36;
/** Thickness of the nut drawn on the gutter's right edge. */
const NUT_W = 4.5;
/** Outline (and X) of a dead note. */
const DEAD_NOTE_EDGE = "#6b7280";
/** A dead note's sustain tail. */
const DEAD_NOTE_FILL = "#374151";
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
/** "1 e & a" under the staff. */
let showCounting = true;
let showTechniqueLabels = true;
let hitAnimations = true;
/** Timing feedback on the notes — labels and the late fill (STYLE.timingHints). */
let timingHints = true;
/** Head + thin sustain tail (true) or the classic one-block bar (false). */
let noteTails = true;
/**
 * The lite board (STYLE.lite), for devices that can't keep up with the full
 * one: half the frames, and none of the drawing that is only there to look
 * good — tail gradients, string winding, the beat's ripple, the spark and beam
 * on a held note, the page turn's slide. The notes, the fills and every mark a
 * hit leaves stay exactly where they are. The caller also sends the canvas at
 * a lower resolution and switches hit animations off (see liteTablatureStyle).
 */
let lite = false;
/** The lite board paints no more often than this — 30 frames a second. */
const LITE_FRAME_MS = 1000 / 30;
/** Rounding room, so a 60 Hz screen's every other frame (33.3 ms) gets through. */
const LITE_FRAME_SLACK_MS = 4;
let lastLitePaintStamp = Number.NEGATIVE_INFINITY;
/** How the frames are keeping up while the tab plays — see framePace.ts. */
const framePace = createFramePace();

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

/** How much of the board's ink a string line carries before its own colour is mixed in. */
const STAFF_LINE_INK = 0.42;
/** How far a string line leans towards its string's colour. */
const STAFF_LINE_TINT = 0.45;
/** The neck: a faint surface under the strings, setting them apart from the rhythm lane. */
const NECK_ALPHA = 0.04;
/** Every other bar's stretch of neck is this much stronger, so bars can be counted at a glance. */
const BAR_WASH_ALPHA = 0.035;
/** The winding on the wound strings: fine gaps in the board's colour along the line. */
const WINDING_ON = 1;
const WINDING_OFF = 1.5;
const WINDING_ALPHA = 0.3;
/** How far the neck reaches past the outer strings — clear of the pills, short of the row below. */
const neckPad = () => BLOCK_H / 2 + 5;


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
  /** Fretting-hand finger (1 = index … 4 = pinky). */
  finger?: number;
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
}

interface TimeSigMarker { x: number; sig: [number, number]; beatIdx: number; }
interface TupletGroup { x1: number; x2: number; num: number; }
interface TempoPoint { beatPos: number; ratio: number; }

// ── Worker state ──────────────────────────────────────────────────────────────
let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;

// Sustain tails fade out along their length. A gradient is built once per
// colour and (whole-pixel) width, starting at x = 0: the tail is drawn under a
// translate, which carries the gradient along with it.
/** How much of a tail's colour is left at its end. It keeps a clear edge there:
 *  a tail that faded to nothing looked like motion blur once the board moved. */
const TAIL_FADE_END = 0.5;
const tailFades = new Map<string, Map<number, CanvasGradient>>();
/** What a `w`-wide tail of `color` is filled with: the colour dying away to the right. */
function tailFade(color: string, w: number): CanvasGradient | string {
  // One flat colour on the lite board: a gradient per tail is fill-rate a slow GPU feels.
  if (lite || !ctx || color.length !== 7 || color[0] !== "#") return color;
  let byWidth = tailFades.get(color);
  if (!byWidth) {
    if (tailFades.size >= COLOR_CACHE_MAX) tailFades.clear();
    byWidth = new Map();
    tailFades.set(color, byWidth);
  } else if (byWidth.size >= COLOR_CACHE_MAX) {
    byWidth.clear();
  }
  const key = Math.max(1, Math.round(w));
  let fade = byWidth.get(key);
  if (!fade) {
    fade = ctx.createLinearGradient(0, 0, key, 0);
    fade.addColorStop(0, color);
    fade.addColorStop(1, withAlpha(color, TAIL_FADE_END));
    byWidth.set(key, fade);
  }
  return fade;
}

// The winding on a wound string: one period of it, in device pixels, kept as a
// repeating pattern and rebuilt only when the board's colour or scale changes.
let windingTile: { key: string; pattern: CanvasPattern | null } | null = null;
function windingPattern(onPx: number, offPx: number): CanvasPattern | null {
  if (!ctx || typeof OffscreenCanvas === "undefined") return null;
  const key = `${bgColor}|${onPx}|${offPx}`;
  if (windingTile?.key === key) return windingTile.pattern;
  const tile = new OffscreenCanvas(onPx + offPx, 1);
  const g = tile.getContext("2d");
  if (g) {
    g.fillStyle = withAlpha(bgColor, WINDING_ALPHA);
    g.fillRect(0, 0, onPx, 1);
  }
  // A failure is kept too, so the dashed fallback doesn't retry every frame.
  windingTile = { key, pattern: g ? ctx.createPattern(tile, "repeat") ?? null : null };
  return windingTile.pattern;
}

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
/** How each beat is counted ("1 e & a") — parallel to renderBeats, recomputed with the data. */
let beatCounts: (BeatCount | null)[] = [];
/** The counted beats inside the bars: in quarter notes, and where they land on the board. */
let beatTickBeats: number[] = [];
let beatTickPx: number[] = [];

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

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// ── Standing board ────────────────────────────────────────────────────────────
// A page turns in step with the music: two thirds of a beat, so a slow piece
// turns unhurried and a fast one is standing again before its next notes are
// due — 333 ms at 120 bpm, kept between the two ends below. Eased at both ends
// (see `easeInOutCubic`): a turn that set off at full speed read as a jolt.
const PAGE_TURN_BEATS = 2 / 3;
const PAGE_TURN_MIN_MS = 180;
const PAGE_TURN_MAX_MS = 480;
const PAGE_TURN_DEFAULT_MS = 330;

/** The tempo at `beat` of the pass, in bpm. */
function tempoAt(beat: number): number {
  let ratio = 1;
  for (const segment of tempoMap) {
    if (segment.beatPos > beat) break;
    ratio = segment.ratio;
  }
  return bpm * ratio;
}

/** How long a page turn starting at `beat` of the pass takes, at the tempo there. */
function pageTurnMs(beat: number): number {
  const tempo = tempoAt(beat);
  if (!(tempo > 0)) return PAGE_TURN_DEFAULT_MS;
  return Math.min(PAGE_TURN_MAX_MS, Math.max(PAGE_TURN_MIN_MS, (60_000 / tempo) * PAGE_TURN_BEATS));
}
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** How far the played part of a standing page is dimmed into the board. */
const PAGE_PLAYED_DIM = 0.5;
/** The page being turned to, and the turn under way towards it. */
let pageTarget: number | null = null;
let pageTurn: { from: number; start: number; ms: number } | null = null;
let pageShown = 0;
let pageCache: { ends: number[]; totalW: number; visibleW: number; starts: number[] } | null = null;

/** Where the pages of the current layout start, worked out once per layout. */
function currentPageStarts(totalW: number, visibleW: number): number[] {
  if (!pageCache || pageCache.ends !== measureEndPx || pageCache.totalW !== totalW || pageCache.visibleW !== visibleW) {
    pageCache = { ends: measureEndPx, totalW, visibleW, starts: pageStarts(measureEndPx, totalW, visibleW) };
  }
  return pageCache.starts;
}

/** The standing board's scroll this frame: the cursor's page, or part-way
 *  through the turn to it. */
function standingScroll(target: number, clockMs: number, beat: number): number {
  // The lite board turns its page in one frame: a slide redraws the whole board all the way.
  if (pageTarget === null || reducedMotion || lite) {
    pageTurn = null;
  } else if (target !== pageTarget) {
    pageTurn = { from: pageShown, start: clockMs, ms: pageTurnMs(beat) };
  }
  pageTarget = target;
  if (pageTurn) {
    const t = Math.min(1, (clockMs - pageTurn.start) / pageTurn.ms);
    pageShown = pageTurn.from + (target - pageTurn.from) * easeInOutCubic(t);
    if (t >= 1) pageTurn = null;
  } else {
    pageShown = target;
  }
  return pageShown;
}
const LEARN_SETTLE_MS = 320;
const LEARN_PING_MS = 1100;
const LEARN_COLOR = "#22d3ee";
/** Motion is off when the tab's animations are, or the system asks for less. */
const learnIsCalm = () => !hitAnimations || reducedMotion;

// ── Frame reuse: its state, and how far left the layout's beats reach ─────────
// (What it is for: "Reusing the frame before", ahead of paintFrame.)
/** The canvas still holds the last frame, drawn for the board as it is now. */
let reuseValid = false;
/** That frame's right bound of what it drew (world x). */
let reuseViewRight = 0;
/** That frame's scroll, in device px. */
let reuseScrollPx = 0;
/** Its first column (device px) with nothing but notes not yet reached. */
let reuseAheadPx = 0;

/** A layout whose notes reach further left than this is drawn whole every frame. */
const REUSE_MAX_REACH = 600;
/** Reach to the left that needs no thought: a beat is first drawn while it is
 *  still this far (world px) beyond the board's right edge. */
const REUSE_FREE_REACH = 30;
/** How far left of its own start each beat draws (world px): a slur comes over
 *  from the note before it on the string, a slide's line from where that note
 *  ended. Everything else a beat draws stays within REUSE_FREE_REACH. */
let beatLeftReach = new Float32Array(0);
/** The longest of them. */
let layoutLeftReach = 0;

function measureLeftReach() {
  beatLeftReach = new Float32Array(renderBeats.length);
  layoutLeftReach = 0;
  const lastOnString = new Map<number, { x: number; slideOut: number }>();
  for (let i = 0; i < renderBeats.length; i++) {
    const x = xMap.xs[i];
    let reach = 0;
    for (const note of renderBeats[i].notes) {
      const before = lastOnString.get(note.noteY);
      if (before && (before.slideOut > 0 || note.isHammerOn || note.isPullOff)) reach = Math.max(reach, x - before.x + 12);
    }
    for (const note of renderBeats[i].notes) lastOnString.set(note.noteY, { x, slideOut: note.slideOut ?? 0 });
    beatLeftReach[i] = reach;
    if (reach > layoutLeftReach) layoutLeftReach = reach;
  }
}

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
  beatTickPx = beatTickBeats.map((beat) => beatToX(xMap, beat));
  measureLeftReach();
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

// The exercise's time runs out here — beats after the start, counted across
// passes (null = the tab loops on). Nothing is drawn past it while playing.
let playUntilBeat: number | null = null;

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
/** timeSig0 — the ten engraved time-signature digits follow it in order. */
const GLYPH_TIME_SIG_0 = 0xe080;
const TIME_SIG_PX = 34;
const TIME_SIG_FONT = `${TIME_SIG_PX}px Bravura`;
const timeSigGlyphs = new Map<number, string>();
/** A time-signature number as Bravura's engraved numerals. */
function timeSigGlyph(n: number): string {
  let glyph = timeSigGlyphs.get(n);
  if (glyph === undefined) {
    glyph = Array.from(n.toString(), (d) => String.fromCharCode(GLYPH_TIME_SIG_0 + Number(d))).join("");
    timeSigGlyphs.set(n, glyph);
  }
  return glyph;
}
const GLYPH_REST = {
  whole: "", half: "", quarter: "",
  eighth: "", sixteenth: "", thirtysecond: "",
};

(function loadBravura() {
  try {
    // `bravuraUrl` is set only where this runs off riff.quest (the MCP tab preview).
    const g = self as unknown as { fonts?: { add: (f: FontFace) => void }; bravuraUrl?: string };
    if (!g.fonts || typeof FontFace === "undefined") return;
    const face = new FontFace("Bravura", `url(${g.bravuraUrl ?? "/alphatab/font/Bravura.woff2"})`);
    face.load().then(f => { g.fonts!.add(f); bravuraReady = true; needsRedraw = true; reuseValid = false; })
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
const TECHNIQUE_FONT = "bold 9px Inter, sans-serif";
/** The "T" tab on a tapped note's head. */
const TAP_TAB_W = 13;
const TAP_TAB_H = 12;
/** Height of a beat tick on the neck's edge. */
const BEAT_TICK_H = 5;
/** How far short of the neck's edges a bar line stops. */
const BAR_LINE_INSET = 3;
/** The palm-mute row, measured from the bottom of the lowest pill — clear of the neck's edge. */
const PM_ROW_GAP = 15;
/** The counting row, below the palm-mute row. */
const COUNT_ROW_GAP = 14;
/** "1 e & a" under the staff. */
const COUNT_FONT = "bold 9px Inter, sans-serif";
/** The playback cursor while it runs. */
const CURSOR_COLOR = "#06b6d4";
/** Bar number at a bar line. */
const BAR_NUMBER_FONT = "bold 11px Inter, sans-serif";
/** Free space two heads need between them for the slur's letter to sit there. */
const HP_TUCK_ROOM = 12;
/** Hammer-on / pull-off letter over a slur. */
const HP_FONT = "bold 11px Inter, sans-serif";
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

const pillEdges = new Map<string, string>();
/** The hairline round a filled pill: its own colour, a good step darker. */
function pillEdge(hex: string): string {
  let edge = pillEdges.get(hex);
  if (edge === undefined) {
    edge = mixHex(hex, "#000000", 0.38);
    if (pillEdges.size >= COLOR_CACHE_MAX) pillEdges.clear();
    pillEdges.set(hex, edge);
  }
  return edge;
}

type BoardTintRole = "line" | "tile" | "tileInk";
const boardTints = new Map<string, string>();
let boardTintsFor = "";
/**
 * A string's colour worked into the board, kept per board: its staff line (the
 * board's ink leaning towards the string), and its gutter tile and that tile's
 * letter while the string isn't about to be played.
 */
function boardTint(role: BoardTintRole, stringColor: string | undefined): string {
  const board = bgColor + inkColor;
  if (board !== boardTintsFor) {
    boardTints.clear();
    boardTintsFor = board;
  }
  const key = role + (stringColor ?? "");
  let color = boardTints.get(key);
  if (color === undefined) {
    const neutral = mixHex(bgColor, inkColor, STAFF_LINE_INK);
    if (!stringColor) color = neutral;
    else if (role === "line") color = mixHex(neutral, stringColor, STAFF_LINE_TINT);
    else if (role === "tile") color = mixHex(bgColor, stringColor, 0.3);
    else color = mixHex(stringColor, inkColor, 0.35);
    if (boardTints.size >= COLOR_CACHE_MAX) boardTints.clear();
    boardTints.set(key, color);
  }
  return color;
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

// ── Fingering badge ───────────────────────────────────────────────────────────
const FINGER_R = 7.5;

/** The fretting finger as a small disc in the board's ink, centred on (x, y). */
function drawFingerBadge(finger: number, x: number, y: number, alpha: number) {
  if (!ctx) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = withAlpha(inkColor, 0.9);
  ctx.beginPath();
  ctx.arc(x, y, FINGER_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = bgColor;
  ctx.font = "700 10px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  drawText(String(finger), x, y + 0.5);
  ctx.restore();
}

// ── Palm mute ─────────────────────────────────────────────────────────────────
/** Stretches of palm-muted beats — recomputed with the render data. */
let pmRuns: PalmMuteRun[] = [];
// Measured once — the label and its font never change.
let palmMuteLabelW = 0;

/**
 * One "P.M." for a whole run of palm-muted beats, in the row below the staff:
 * the label under the first muted note, a dashed line to the last, and a hook
 * up where the muting ends. `x0` is the first head's left edge, `x1` the last
 * head's right edge, `room` the run's full width — a run too narrow for the
 * label gets "PM", and one too short for a line gets the label alone.
 */
function drawPalmMuteSpan(x0: number, x1: number, room: number, live: boolean) {
  if (!ctx) return;
  const staffBottom = STAFF_TOP + 5 * STRING_SPACING;
  // Held inside the board when wide string spacing leaves little room under the staff.
  const y = Math.min(BASE_H - 7, staffBottom + BLOCK_H / 2 + PM_ROW_GAP);
  ctx.font = "bold 11px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = withAlpha(inkColor, live ? 0.95 : 0.6);
  if (palmMuteLabelW === 0) palmMuteLabelW = ctx.measureText("P.M.").width;
  const fits = palmMuteLabelW + 6 <= room;
  drawText(fits ? "P.M." : "PM", x0, y);
  const lineX = x0 + palmMuteLabelW + 5;
  if (!fits || x1 - lineX < 8) return;
  ctx.strokeStyle = withAlpha(inkColor, live ? 0.7 : 0.4);
  ctx.lineWidth = 1.2;
  ctx.lineCap = "butt";
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(lineX, y); ctx.lineTo(x1, y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1, y - 5); ctx.stroke();
}

// ── Bend badge ────────────────────────────────────────────────────────────────
function drawBendBadge(
  label: string, icon: string,
  bgColor: string, textColor: string,
  bx: number, by: number, noteY: number,
) {
  if (!ctx) return;
  ctx.font = "bold 14px Inter, sans-serif";
  const fullText = `${icon} ${label}`;
  let tw = bendTextWidthCache.get(fullText);
  if (tw === undefined) { tw = ctx.measureText(fullText).width; bendTextWidthCache.set(fullText, tw); }
  const padX = 7, bw = tw + padX * 2, bh = 22, r = 6;
  // The box is wider than the head it labels: on the opening note it would
  // slide under the tuning gutter, so it stops at the board's left edge while
  // the connector stays on the note.
  const cx = Math.max(bx, bw / 2 + 2);

  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.moveTo(cx - bw / 2 + r, by - bh / 2);
  ctx.lineTo(cx + bw / 2 - r, by - bh / 2);
  ctx.arcTo(cx + bw / 2, by - bh / 2, cx + bw / 2, by - bh / 2 + r, r);
  ctx.lineTo(cx + bw / 2, by + bh / 2 - r);
  ctx.arcTo(cx + bw / 2, by + bh / 2, cx + bw / 2 - r, by + bh / 2, r);
  ctx.lineTo(cx - bw / 2 + r, by + bh / 2);
  ctx.arcTo(cx - bw / 2, by + bh / 2, cx - bw / 2, by + bh / 2 - r, r);
  ctx.lineTo(cx - bw / 2, by - bh / 2 + r);
  ctx.arcTo(cx - bw / 2, by - bh / 2, cx - bw / 2 + r, by - bh / 2, r);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = textColor; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  drawText(fullText, cx, by + 0.5);

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

// ── Sustain: the fill running along a held note's tail ────────────────────────
// While a note is held, the filled part of its tail is a beam of blue-white
// light. At its front rides a small charged spark — a bright point with short
// arcs jumping round it — shedding little stars behind it. A note held to its
// end only lets the beam fade: nothing bursts and nothing leaves the note.
//
// The light is its own blue-white whatever hit colour is chosen — it is the
// reward, and reads apart from the fill it rides on.
/** How long the beam of a note held to its end takes to fade. */
const SUSTAIN_DONE_MS = 420;
/** How quickly the star lights up and dies down, per frame. */
const SUSTAIN_SPARK_EASE = 0.22;
const STAR_WHITE = "#ffffff";
const STAR_BLUE = "#7dd3fc";
/** The beam, widest and faintest first: [width, colour, share of its strength]. */
const STAR_BEAM: readonly (readonly [number, string, number])[] = [
  [14, "rgba(56,189,248,0.5)", 0.6],
  [6, STAR_BLUE, 1],
  [2.2, STAR_WHITE, 1],
];
/** How far the beam sways off the string, in world px. */
const STAR_BEAM_SWAY = 1.2;
/** The same "random" number for the same particle every frame, so each keeps its path. */
const starRandom = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** Motion is off when the tab's animations are, or the system asks for less. */
const sustainIsCalm = () => !hitAnimations || reducedMotion;

/** A four-pointed star, `r` to its tips, turned by `spin`. Drawn at the current globalAlpha. */
function drawStar(x: number, y: number, r: number, spin: number, color: string) {
  if (!ctx) return;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = spin + (i * Math.PI) / 4;
    const reach = i % 2 === 0 ? r : r * 0.28;
    ctx.lineTo(x + Math.cos(angle) * reach, y + Math.sin(angle) * reach);
  }
  ctx.closePath();
  ctx.fill();
}

/** The beam's line from x0 to x1, swaying a little, added to `path`. */
function starBeamLine(path: { moveTo(x: number, y: number): void; lineTo(x: number, y: number): void }, x0: number, x1: number, y: number, time: number) {
  for (let x = x0; x <= x1; x += 3) {
    const grow = Math.min(1, (x - x0) / 30);
    const sway = Math.sin(x / 11 - time / 55) + Math.sin(x / 4.5 + time / 31) * 0.3;
    if (x === x0) path.moveTo(x, y + sway * STAR_BEAM_SWAY * grow);
    else path.lineTo(x, y + sway * STAR_BEAM_SWAY * grow);
  }
}

/** The filled part of a tail as a beam of light from x0 to x1, swaying a little. */
function drawStarBeam(x0: number, x1: number, y: number, strength: number, time: number) {
  if (!ctx || x1 - x0 < 4 || strength <= 0.02) return;
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  // The same line under all three widths: worked out once a frame, not three
  // times — every held string of a chord has a beam of its own.
  let line: Path2D | null = null;
  if (typeof Path2D !== "undefined") {
    line = new Path2D();
    starBeamLine(line, x0, x1, y, time);
  }
  for (const [width, color, share] of STAR_BEAM) {
    ctx.globalAlpha = strength * share;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    if (line) {
      ctx.stroke(line);
    } else {
      ctx.beginPath();
      starBeamLine(ctx, x0, x1, y, time);
      ctx.stroke();
    }
  }
  ctx.lineCap = "butt";
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

/** The spark's halo, painted once per size into a bitmap: a gradient made
 *  anew for every held note in every frame was the costliest part of it. */
const SPARK_HALO = "125,211,252";
const sparkHalos = new Map<number, OffscreenCanvas>();

/** The halo for a spark `r` world px in radius, at device resolution, or null
 *  where the worker can't make canvases of its own. */
function sparkHaloSprite(r: number): OffscreenCanvas | null {
  if (typeof OffscreenCanvas === "undefined") return null;
  const rPx = Math.max(1, Math.ceil(r * dpr * vscale));
  const cached = sparkHalos.get(rPx);
  if (cached) return cached;
  const sprite = new OffscreenCanvas(rPx * 2, rPx * 2);
  const g = sprite.getContext("2d");
  if (!g) return null;
  const halo = g.createRadialGradient(rPx, rPx, 0, rPx, rPx, rPx);
  halo.addColorStop(0, `rgba(${SPARK_HALO},0.8)`);
  halo.addColorStop(1, `rgba(${SPARK_HALO},0)`);
  g.fillStyle = halo;
  g.beginPath();
  g.arc(rPx, rPx, rPx, 0, Math.PI * 2);
  g.fill();
  if (sparkHalos.size >= 8) sparkHalos.clear();
  sparkHalos.set(rPx, sprite);
  return sprite;
}

/** How often the arcs round the spark jump to new places. */
const SPARK_ARC_MS = 55;
const SPARK_ARCS = 4;

/** A short jagged arc from (x, y) out along `angle`, `length` long. */
function sparkArcPath(x: number, y: number, angle: number, length: number, seed: number) {
  if (!ctx) return;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  ctx.moveTo(x, y);
  for (let step = 1; step <= 3; step++) {
    const along = (length * step) / 3;
    const off = step === 3 ? 0 : (starRandom(step, seed) - 0.5) * 7;
    ctx.lineTo(x + dx * along - dy * off, y + dy * along + dx * off);
  }
}

/** The front of a growing fill, centred on (x, y): the beam back to `fromX`,
 *  a small charged spark with arcs jumping round it, and the small stars it
 *  sheds. `strength` 0–1. */
function drawSustainFront(x: number, y: number, tailH: number, fromX: number, strength: number, frameNow: number) {
  // The lite board keeps the fill's round front and nothing that glows on top of it.
  if (!ctx || lite || strength <= 0.02) return;
  const calm = sustainIsCalm();
  const time = calm ? 0 : frameNow;
  drawStarBeam(fromX, x, y, strength, time);
  const r = BLOCK_H * 0.55;
  const haloSprite = sparkHaloSprite(r);
  if (haloSprite) {
    ctx.globalAlpha = strength;
    ctx.drawImage(haloSprite, x - r, y - r, r * 2, r * 2);
  } else {
    const halo = ctx.createRadialGradient?.(x, y, 0, x, y, r);
    if (halo) {
      halo.addColorStop(0, `rgba(${SPARK_HALO},0.8)`);
      halo.addColorStop(1, `rgba(${SPARK_HALO},0)`);
      ctx.globalAlpha = strength;
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (!calm) {
    // Arcs: the same few until the next jump, blue under a white core.
    const tick = Math.floor(time / SPARK_ARC_MS);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const [width, color] of [[2.4, STAR_BLUE], [1, STAR_WHITE]] as const) {
      ctx.globalAlpha = strength * 0.9;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      for (let i = 0; i < SPARK_ARCS; i++) {
        const seed = tick * 13 + i * 7;
        sparkArcPath(x, y, starRandom(i, seed) * Math.PI * 2, 8 + 8 * starRandom(i, seed + 1), seed + 2);
      }
      ctx.stroke();
    }
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";
  }
  ctx.globalAlpha = strength;
  ctx.fillStyle = STAR_WHITE;
  ctx.beginPath();
  ctx.arc(x, y, tailH * 0.45, 0, Math.PI * 2);
  ctx.fill();
  if (!calm) {
    for (let i = 0; i < 5; i++) {
      const life = (time / 600 + starRandom(i, 3)) % 1;
      const px = x - life * (40 + 60 * starRandom(i, 1));
      if (px <= fromX) continue;
      ctx.globalAlpha = strength * (1 - life);
      drawStar(px, y + (starRandom(i, 2) - 0.5) * 34 * life, 4.5 * (1 - life) + 1, time / 200 + i, i % 2 ? STAR_BLUE : STAR_WHITE);
    }
  }
  ctx.globalAlpha = 1;
}

/** A note held to its end, `age` (0–1) on: the beam along its tail, from
 *  `tailX` to `endX`, fades out and leaves the plain fill. */
function drawSustainDone(tailX: number, endX: number, y: number, age: number, frameNow: number) {
  if (!ctx || endX <= tailX) return;
  drawStarBeam(tailX, endX, y, 1 - age, frameNow);
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
  ctx.globalAlpha = (active ? 0.09 : 0.045) * dim;
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
const CHORD_TAG_RADIUS = CHORD_TAG_H / 2;
/** Tag's left edge from the centre of the beat's head: past the notehead and pick mark. */
const CHORD_TAG_X = 10;
/** Room between the tag and the tops of the pills under it — kept small so the
 *  tag also stays below the rhythm lane's noteheads. */
const CHORD_TAG_GAP = 2;
const CHORD_TAG_CACHE_MAX = 64;
const chordTagWidths = new Map<string, number>();
const chordTagSprites = new Map<string, OffscreenCanvas>();

/** Paints a `w`-wide chord tag with its top-left corner at the origin of `g`. */
function paintChordTag(g: OffscreenCanvasRenderingContext2D, label: string, w: number) {
  g.fillStyle = mixHex(bgColor, inkColor, 0.08);
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

  // The nut: the bar the strings run from. An object on the board, not a
  // divider — it is what makes the staff read as a neck.
  ctx.fillStyle = withAlpha(inkColor, 0.8);
  drawPill(GUTTER_W - NUT_W + 1, STAFF_TOP - 6, NUT_W, 5 * STRING_SPACING + 12, NUT_W / 2);
  ctx.fill();

  const pillX = 4, pillW = 26, pillH = BLOCK_H, r = BLOCK_CORNER;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const st of tuningStrings) {
    const y = STAFF_TOP + stringRow(st.string, flipStrings, stringCount) * STRING_SPACING;
    const top = y - pillH / 2;
    // Notes are hidden (ear training) → light every string so we don't leak
    // which one is coming next; otherwise only the strings about to be played.
    const lit = hideNotes || active.has(st.string);

    // A string that isn't up next keeps a dimmed tile in its own colour, so the
    // tile, the line and the pills on it still read as one string.
    ctx.globalAlpha = 1;
    ctx.fillStyle = lit ? st.color : boardTint("tile", st.color);
    drawPill(pillX, top, pillW, pillH, r);
    ctx.fill();

    ctx.globalAlpha = lit ? 1 : 0.6;
    // Lit pills carry the string colour, so they follow the fret-number setting;
    // dimmed ones sit on a neutral grey and keep their own readable tone.
    const litInk = fretTextColor === "auto" ? readableInk(st.color) : fretTextColor;
    ctx.fillStyle = lit ? litInk : boardTint("tileInk", st.color);
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

// ── Reusing the frame before ─────────────────────────────────────────────────
// A note the cursor hasn't reached looks the same in every frame — only where
// it is on the screen changes, and it changes by a whole number of device
// pixels (the board scrolls on the pixel grid). So while the board plays, the
// part of the last frame that lies ahead of the cursor is moved, not drawn
// again: one copy instead of every string, pill, digit and rhythm glyph in
// three quarters of the board, 165 times a second. What is drawn afresh is
// everything up to and around the cursor — the notes being played and judged,
// their fills, pops and labels, the fade over what was played, the gutter —
// and the strip that scrolled in on the right.
//
// The two must tile the board exactly: a column drawn twice would blend its
// translucent parts twice. Hence the clip on whole device pixels.
/** How far outside a strip its beats are still looked for (world px): a chord
 *  name, a slur or a let-ring trail reaches past the beat that owns it. */
const REUSE_OVERHANG = 160;
/** Narrower than this (device px), what is left to reuse isn't worth a copy —
 *  and wide enough that the two strips never look at the same played beat. */
const REUSE_MIN_STATIC_PX = 400;
/** How far right of the cursor something still in motion may reach (world
 *  px): a hit's glow, a timing label, a bend gauge beside a short note. */
const REUSE_CURSOR_REACH = 140;
/** …and past the end of the beat under the cursor: its lit pill and gauge. */
const REUSE_BEAT_REACH = 80;
/** Messages that only touch notes the cursor has reached — never what lies
 *  ahead of it. After any other message the next frame is drawn whole. */
const REUSE_SAFE_MESSAGES = new Set([
  "TICK", "FILL_STEPS", "FILL_RESET",
  "HIT_NOTES", "HIT_NOTES_PATCH", "MISSED_NOTES", "MISSED_NOTES_PATCH", "NOTE_TIMINGS", "NOTE_TIMINGS_PATCH",
]);
/** The longest reach to the left among the beats that came into the drawn
 *  range (their head at or before the right bound) since the last frame. */
function enteredLeftReach(lastRight: number, right: number, seamless: boolean): number {
  const totalW = xMap.totalX;
  const head = BLOCK_PAD + BLOCK_H / 2;
  const tiled = seamless && totalW > 0;
  const firstTile = tiled ? Math.max(0, Math.floor(lastRight / totalW)) : 0;
  const lastTile = tiled ? Math.floor(right / totalW) : 0;
  let reach = 0;
  for (let tile = firstTile; tile <= lastTile; tile++) {
    const from = lastRight - tile * totalW - head;
    const to = right - tile * totalW - head;
    let lo = 0, hi = renderBeats.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (xMap.xs[mid] <= from) lo = mid + 1; else hi = mid;
    }
    for (let i = lo; i < renderBeats.length && xMap.xs[i] <= to; i++) {
      if (beatLeftReach[i] > reach) reach = beatLeftReach[i];
    }
  }
  return reach;
}

/** World x up to which this frame's look depends on the cursor: the beat (and
 *  palm-mute run) it is in, and the reach of what moves around it. */
function reachedRight(dispCursor: number, wrappedCursor: number): number {
  const tileOff = dispCursor - wrappedCursor;
  let right = dispCursor + REUSE_CURSOR_REACH;
  // The last beat that starts at or before the cursor.
  let lo = 0, hi = renderBeats.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (xMap.xs[mid] <= wrappedCursor) lo = mid + 1; else hi = mid;
  }
  if (lo > 0) right = Math.max(right, tileOff + xMap.xs[lo] + REUSE_BEAT_REACH);
  for (const run of pmRuns) {
    const runL = xMap.xs[run.start];
    if (runL > wrappedCursor) break;
    const runR = xMap.xs[run.end + 1];
    if (wrappedCursor < runR) right = Math.max(right, tileOff + runR + REUSE_BEAT_REACH);
  }
  return right;
}

// ── Main render frame ─────────────────────────────────────────────────────────
/** The longest a frame's own timestamp may trail the clock and still be used. */
const FRAME_STAMP_MAX_LAG_MS = 100;

function paintFrame(frameStamp?: number) {
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
  // So do the hits' pop stamps, for the same reason.
  if (visual.hitTimestampsCount > 0) {
    for (const key of Object.keys(visual.hitTimestamps)) {
      if (frameNow - visual.hitTimestamps[key] >= HIT_ANIM_MS) {
        delete visual.hitTimestamps[key];
        visual.hitTimestampsCount--;
      }
    }
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
  // The board moves by the frame's own timestamp, which ticks with the screen,
  // not by the moment this code happens to run: that moment drifts a few ms
  // from frame to frame, the scroll steps came out uneven, and edges doubled
  // under an eye following the notes. A stamp that is missing or far behind
  // (a stalled frame) falls back to the clock.
  const clockMs = performance.now();
  const frameLagMs = frameStamp !== undefined && Number.isFinite(frameStamp) ? clockMs - frameStamp : 0;
  const stampLagMs = frameLagMs >= 0 && frameLagMs <= FRAME_STAMP_MAX_LAG_MS ? frameLagMs : 0;
  const audioNow = audioClockNow(audioClock, clockMs - stampLagMs);
  const fillRenderSec = audioNow !== null ? audioNow - liveFills.delaySec : null;

  if (isPlaying && countInRemaining === 0) {
    const elapsed = (audioStartSec !== null && audioNow !== null && clockFromTicks)
      ? (audioNow - audioStartSec)
      : startWallMs !== null ? (Date.now() - stampLagMs - startWallMs) / 1000 : 0;
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
    lastDispCursor = dispCursor;
    lastSeamless = seamless;
    // Pause/seek anchor stays within a single repetition (tile-0 space)
    pausedCursorPos = wrappedCursor;
    if (pagedScroll) {
      const starts = currentPageStarts(totalW, viewW - contentLeft);
      scrollX = standingScroll(pagedScrollX(starts, dispCursor - wrappedCursor, wrappedCursor), clockMs - stampLagMs, xToBeat(xMap, wrappedCursor));
      // Pausing leaves the page where it stands.
      pausedScrollX = pagedScrollX(starts, 0, wrappedCursor);
    } else {
      scrollX = Math.max(0, dispCursor - viewW / 4);
      pausedScrollX = Math.max(0, wrappedCursor - viewW / 4);
    }
  }
  if (!isPlaying || countInRemaining !== 0 || !pagedScroll) { pageTarget = null; pageTurn = null; }

  // The board scrolls in whole device pixels. At a fractional offset every edge
  // and every glyph is antialiased differently from one frame to the next, and
  // a tab that is sharp when it stands still smears as soon as it moves.
  const devicePx = dpr * vscale;
  scrollX = Math.round(scrollX * devicePx) / devicePx;
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

  // Everything the board shows, for the beats between cullL and cullR (world
  // x). Called once for the whole board, or once per strip when the rest of
  // the last frame is reused — the caller has then clipped to the strip.
  const drawBoard = (cullL: number, cullR: number, withGutter: boolean) => {
  if (!ctx) return;
  // ── Clear & translate ────────────────────────────────────────────────────
  // Set every frame, not only on INIT/RESIZE: a context restored after a GPU
  // reset (or a frame that threw between save and restore) is left on the
  // identity transform. The board then draws at 1/(dpr·vscale) of its size and
  // the clear stops short of the right edge, so every note scrolled past piles
  // up in the uncleared strip.
  ctx.setTransform(dpr * vscale, 0, 0, dpr * vscale, 0, 0);
  ctx.clearRect(0, 0, viewW, viewH);
  ctx.save();
  ctx.translate(contentLeft - scrollX, 0);

  // ── Where the exercise's time runs out ───────────────────────────────────
  // Bars the remaining time can't fit are not drawn at all: everything from the
  // end of the last one that fits is clipped away, staff lines included, so
  // the board ends there instead of offering music that will be cut short.
  let playUntilX: number | null = null;
  if (seamless && playUntilBeat !== null && totalBeats > 0) {
    const pass = Math.floor(playUntilBeat / totalBeats + 1e-9);
    playUntilX = pass * totalW + beatToX(xMap, playUntilBeat - pass * totalBeats);
    ctx.save();
    ctx.beginPath();
    ctx.rect(viewL, -viewH, Math.max(0, playUntilX - viewL), viewH * 3);
    ctx.clip();
  }

  // ── The neck and its strings — by gauge, in their colours (drawn once) ────
  if (!hideNotes) {
    const lineL = Math.max(0, scrollX);
    const lineR = seamless ? scrollX + viewW + 10 : Math.min(totalW, scrollX + viewW + 10);
    ctx.fillStyle = withAlpha(inkColor, NECK_ALPHA);
    ctx.fillRect(lineL, STAFF_TOP - neckPad(), lineR - lineL, 5 * STRING_SPACING + neckPad() * 2);
    ctx.lineCap = "butt";
    let boardMatrix: DOMMatrix | null = null;
    for (let row = 0; row < stringCount; row++) {
      const y = STAFF_TOP + row * STRING_SPACING;
      const width = staffLineWidth(row, flipStrings, stringCount);
      const stringNumber = flipStrings ? stringCount - row : row + 1;
      ctx.strokeStyle = boardTint("line", stringColors[stringNumber - 1]);
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(lineL, y); ctx.lineTo(lineR, y);
      ctx.stroke();
      if (width > 1 && !lite) {
        // The winding. Its phase is tied to the board, not to the line's left
        // end, so it stays put on the string while the tab scrolls. Both the
        // pattern and its phase are whole device pixels: a 2.5px period at a
        // fractional scroll position aliased into ragged, uneven dashes.
        boardMatrix ??= ctx.getTransform();
        const m = boardMatrix;
        const scale = Math.abs(m.a) || 1;
        const onPx = Math.max(1, Math.round(WINDING_ON * scale));
        const offPx = Math.max(1, Math.round(WINDING_OFF * scale));
        const winding = windingPattern(onPx, offPx);
        if (winding) {
          // Filled in device pixels from a one-period tile: a dashed stroke
          // this fine is hundreds of dashes per string, every frame.
          const anchor = Math.round(m.e);
          ctx.setTransform(1, 0, 0, 1, anchor, 0);
          ctx.fillStyle = winding;
          ctx.fillRect(Math.min(m.a * lineL, m.a * lineR) + m.e - anchor, m.d * (y - width / 2) + m.f, scale * (lineR - lineL), m.d * width);
          ctx.setTransform(m);
        } else {
          const on = onPx / scale;
          const off = offPx / scale;
          const period = on + off;
          const origin = (Math.round(m.e) - m.e) / m.a;
          ctx.strokeStyle = withAlpha(bgColor, WINDING_ALPHA);
          ctx.setLineDash([on, off]);
          ctx.lineDashOffset = (((lineL - origin) % period) + period) % period;
          ctx.beginPath();
          ctx.moveTo(lineL, y); ctx.lineTo(lineR, y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.lineDashOffset = 0;
        }
      }
    }
  }

  // ── Per-tile score content — one tile per visible repetition ─────────────
  // In seamless full-loop mode the score is tiled so the viewport can straddle
  // a repetition boundary; tileStart..tileEnd is 0..0 in every other case.
  for (let tile = tileStart; tile <= tileEnd; tile++) {
    const tileOff = tile * totalW;
    // Local (tile-space) viewport + cursor — shadow the outer world-space values
    const visL = cullL - tileOff;
    const visR = cullR - tileOff;
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

  // ── Bars — alternate wash, numbers, beat ticks ───────────────────────────
  // Every other bar's stretch of neck sits on a faint wash and each bar carries
  // its number at its opening bar line (the first one goes without, as in
  // print). Parity runs on across repetitions so two unwashed bars never meet
  // at the loop seam.
  const neckTop = STAFF_TOP - neckPad();
  const neckBottom = STAFF_TOP + 5 * STRING_SPACING + neckPad();
  if (showMeasureLines && !hideNotes && measureEndPx.length > 0) {
    ctx.font = BAR_NUMBER_FONT;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    for (let mi = 0; mi < measureEndPx.length; mi++) {
      const barL = mi === 0 ? 0 : measureEndPx[mi - 1];
      const barR = measureEndPx[mi];
      if (barR < visL) continue;
      if (barL > visR) break;
      if ((tile * measureEndPx.length + mi) % 2 === 1) {
        ctx.fillStyle = withAlpha(inkColor, BAR_WASH_ALPHA);
        ctx.fillRect(barL, neckTop, barR - barL, neckBottom - neckTop);
      }
      if (mi > 0) {
        ctx.fillStyle = withAlpha(inkColor, 0.6);
        drawText(String(mi + 1), barL - 5, STAFF_TOP - 5);
      }
    }

    // The beats inside each bar, ticked on both edges of the neck.
    ctx.strokeStyle = withAlpha(inkColor, 0.3);
    ctx.lineWidth = 1;
    ctx.lineCap = "butt";
    ctx.beginPath();
    for (const x of beatTickPx) {
      if (x < visL) continue;
      if (x > visR) break;
      ctx.moveTo(x, neckTop); ctx.lineTo(x, neckTop + BEAT_TICK_H);
      ctx.moveTo(x, neckBottom); ctx.lineTo(x, neckBottom - BEAT_TICK_H);
    }
    ctx.stroke();
  }

  // ── Measure lines — single batched path ─────────────────────────────────
  // Drawn like frets: heavier than a string, across the whole neck.
  if (showMeasureLines) {
    const barTop = neckTop + BAR_LINE_INSET;
    const barBottom = neckBottom - BAR_LINE_INSET;
    ctx.strokeStyle = withAlpha(inkColor, 0.4);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, barTop); ctx.lineTo(0, barBottom);
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
        ctx.moveTo(x, barTop); ctx.lineTo(x, barBottom);
      }
    }
    ctx.stroke();

    // The last bar closes with a final bar line: thin, then thick.
    const endX = measureEndPx[measureEndPx.length - 1];
    if (endX !== undefined && endX >= visL && endX <= visR) {
      ctx.strokeStyle = withAlpha(inkColor, 0.5);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(endX - 7, barTop); ctx.lineTo(endX - 7, barBottom); ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(endX - 1.5, barTop); ctx.lineTo(endX - 1.5, barBottom); ctx.stroke();
    }
    ctx.lineCap = "butt";
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
    // Centre of the beat's head: the rhythm lane's notehead, the pill and the
    // count under the staff share one column.
    const beatL = beatPx + BLOCK_PAD + BLOCK_H / 2;

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
      chordTagEnd = drawChordTag(beat.chordName, beatL + CHORD_TAG_X, STAFF_TOP - BLOCK_H / 2 - CHORD_TAG_GAP - CHORD_TAG_H);
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

      // A chord is one strum, so it is drawn as one thing: its fret numbers
      // stacked where it is struck, and a single box for as long as it rings
      // (see drawChordBox) — its notes get heads and no tails, whatever the
      // tail setting.
      const isChordBox = beat.notes.length >= CHORD_BOX_MIN_NOTES;
      // The pace a held note's fill runs at here (liveFillDrawnBeat).
      const beatsPerSec = tempoAt(beat.offsetX) / 60;
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
            : liveFill ? heldFillWidth(liveFillDrawnBeat(liveFill, fillRenderSec, beatsPerSec), beatPx, beat.offsetX, pxPerBeat, blockX, blockW)
              : (noteVisualFill.get(note.noteKey) ?? 0);
          if (hit) held = Math.max(held, fill);
          if (hit || !(reached && tileMissed[note.noteKey])) allMissed = false;
        }
        drawChordBox(blockX, blockW, top, bottom, isActive, held, allMissed ? 0.4 : 1);
        // Inside the box each string rings on in its own colour, dying away.
        const ringX = blockX + BLOCK_H / 2;
        const ringW = blockW - BLOCK_H / 2 - CHORD_BOX_PAD - 2;
        if (ringW > BLOCK_H) {
          const ringH = Math.max(6, Math.round(BLOCK_H * 0.42));
          ctx.globalAlpha = (isActive ? 0.75 : 0.55) * (allMissed ? 0.4 : 1);
          ctx.translate(ringX, 0);
          for (const note of beat.notes) {
            ctx.fillStyle = tailFade(note.color, ringW);
            drawPill(0, note.noteY - ringH / 2, ringW, ringH, ringH / 2);
            ctx.fill();
          }
          ctx.translate(-ringX, 0);
          ctx.globalAlpha = 1;
        }
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
        const dynAlpha = hasDynamics && note.dynamics !== undefined ? 0.3 + 0.7 * dyn : 1.0;
        const missedDim = reached && !isHit && tileMissed[note.noteKey] ? 0.2 : 1.0;
        const baseAlpha = dynAlpha * ghostAlpha * missedDim;

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
        // Only while the pop lasts. A streamed hit keeps its time for good, and
        // without the age check every note ever hit went on drawing the pop's
        // rings — faded to nothing — in every frame, for as long as it was on
        // the board: the further into a pass, the more the board had to draw.
        const isAnimatingHit = isHit && hitAt !== undefined && frameNow - hitAt < HIT_ANIM_MS;
        // A paused board repaints only when asked: once more after the pop, to clear it.
        if (isAnimatingHit) needsRedraw = true;

        // Palm-muted notes keep their string colour — the P.M. lane under the
        // staff marks them, and a grey pill read as a disabled note.
        // An open string and a dead note are drawn hollow — an outline on the
        // board's own colour — so "nothing fretted" reads before the digit does.
        // Played (or, for an open string, under the cursor) they fill in like
        // any other note: a lighter block instead of a white digit.
        const isHollow = !isHarm && !isHit && (isDead || (note.fret === 0 && !isActive));
        if (isHollow) fillColor = bgColor;
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
          fillW = heldFillWidth(liveFillDrawnBeat(liveFill, fillRenderSec, beatsPerSec), beatPx, beat.offsetX, pxPerBeat, blockX, blockW);
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

        // A note filled to its end is the note's own shape in the hit colour:
        // no need to clip a rectangle to it, frame after frame, once it is full.
        const filledWhole = fillStartW === 0 && fillW >= blockW - 0.5;

        if (isHarm) {
          // Harmonic: outlined pill
          const col = note.harmonicType === 1 ? note.color : "#e879f9";
          ctx.globalAlpha = ghostAlpha;
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
          if (filledWhole) {
            notePath();
            ctx.fillStyle = withAlpha(hitFill, 0.4);
            ctx.fill();
          } else if (fillW > 0) {
            ctx.save();
            notePath();
            ctx.clip();
            ctx.fillStyle = withAlpha(hitFill, 0.4);
            ctx.fillRect(blockX + fillStartW, blockY, Math.max(0, fillW - fillStartW), BLOCK_H);
            ctx.restore();
          }

        } else {
          const alpha = isHit ? 1.0 : baseAlpha;

          // Sustain tail: the string's colour, dying away along its length so
          // the head stays the thing your eye lands on. Dead notes keep their grey.
          if (hasTail) {
            ctx.globalAlpha = alpha * (isActive ? 0.8 : 0.6);
            ctx.fillStyle = tailFade(isDead ? DEAD_NOTE_FILL : note.color, tailW);
            ctx.translate(tailX, 0);
            drawPill(0, tailY, tailW, tailH, tailH / 2);
            ctx.fill();
            ctx.translate(-tailX, 0);
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

          if (isHollow) {
            ctx.strokeStyle = isDead ? DEAD_NOTE_EDGE : note.color;
            ctx.lineWidth = 2;
            drawPill(blockX + 1, blockY + 1, headW - 2, BLOCK_H - 2, Math.max(0, BLOCK_CORNER - 1));
            ctx.stroke();
          } else {
            // A hairline in the pill's own colour, darker: a crisp contour on any board.
            ctx.strokeStyle = pillEdge(note.color);
            ctx.lineWidth = 1;
            drawPill(blockX + 0.5, blockY + 0.5, headW - 1, BLOCK_H - 1, BLOCK_CORNER);
            ctx.stroke();
          }
          // An accent is a ring round its note. (Dimming the rest of the bar
          // instead made whole stretches of the tab look switched off.)
          if (note.isAccented && hasAccentedNotes) {
            ctx.strokeStyle = withAlpha(inkColor, 0.9);
            ctx.lineWidth = 1.5;
            drawPill(blockX - 2.5, blockY - 2.5, headW + 5, BLOCK_H + 5, BLOCK_CORNER + 2.5);
            ctx.stroke();
          }

          // Solid bar keeps its original sheen: a lighter strip on the top half.
          if (!headsOnly && !isHollow) {
            ctx.fillStyle = "rgba(255,255,255,0.14)";
            drawPill(blockX + 1, blockY + 1, blockW - 2, BLOCK_H / 2 - 1, BLOCK_CORNER);
            ctx.fill();
          }

          // Progressive filling with green tied to the playback cursor
          if (filledWhole) {
            notePath();
            ctx.fillStyle = finalHitColor;
            ctx.fill();
          } else if (fillW > 0 && hasTail) {
            // A note with a tail: the head fills as the fill crosses it, then
            // the fill runs down the tail as a bar of its own with a round
            // front — no clipping, and no flat cut for a leading edge.
            ctx.fillStyle = finalHitColor;
            if (fillStartW === 0 && fillW >= headW) {
              drawPill(blockX, blockY, headW, BLOCK_H, BLOCK_CORNER);
              ctx.fill();
            } else if (fillStartW < headW) {
              ctx.save();
              drawPill(blockX, blockY, headW, BLOCK_H, BLOCK_CORNER);
              ctx.clip();
              ctx.fillRect(blockX + fillStartW, blockY, Math.max(0, Math.min(fillW, headW) - fillStartW), BLOCK_H);
              ctx.restore();
            }
            const edge = blockX + fillW;
            const from = Math.max(tailX, blockX + fillStartW);
            const capR = tailH / 2;
            if (fillW > headW && edge - capR > from) {
              ctx.fillStyle = finalHitColor;
              ctx.fillRect(from, tailY, edge - capR - from, tailH);
              ctx.beginPath();
              ctx.arc(edge - capR, note.noteY, capR, -Math.PI / 2, Math.PI / 2);
              ctx.fill();
              drawSustainFront(edge - capR, note.noteY, tailH, from, liveFill ? liveFill.spark : 0, frameNow);
              ctx.globalAlpha = alpha;
            }
          } else if (fillW > 0) {
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

          // The spark burns while the fill moves and dies down when it stops;
          // a fill that reaches the note's end sets off its closing animation.
          if (liveFill && !isOutgoing) {
            const moving = isPlaying && fillW > liveFill.drawnW + 0.01 && fillW < blockW - 0.5;
            liveFill.spark += ((moving ? 1 : 0) - liveFill.spark) * SUSTAIN_SPARK_EASE;
            liveFill.drawnW = fillW;
            if (hasTail && filledWhole && liveFill.doneAt === null) liveFill.doneAt = frameNow;
            if (hasTail && !sustainIsCalm()) {
              const doneAge = liveFill.doneAt !== null ? (frameNow - liveFill.doneAt) / SUSTAIN_DONE_MS : 1;
              if (doneAge < 1) {
                drawSustainDone(tailX, blockX + blockW - tailH / 2, note.noteY, doneAge, frameNow);
                needsRedraw = true;
              }
            }
          }

          // Dead note X over the pill
          if (isDead) {
            ctx.strokeStyle = isActive ? "#94a3b8" : DEAD_NOTE_EDGE;
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
        }

        // ── Fret label ────────────────────────────────────────────────────
        if (!isDead) {
          // "auto" reads the pill's own colour, so a dark palette gets light digits.
          // A hollow pill shows the board through, so its digit is in the board's ink.
          ctx.fillStyle = isHollow ? inkColor : fretTextColor === "auto" ? readableInk(note.color) : fretTextColor;
          ctx.font = fretFont(fs);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          let text = note.fret.toString();
          if (note.isGhost) text = `(${text})`;
          drawText(text, labelX, note.noteY + 0.5);
        }

        // ── Fingering badge ───────────────────────────────────────────────
        // Which fretting finger plays the note, on the note itself so a chord's
        // or a dyad's fingers can't be mixed up. It sits on the tail, right of
        // the fret number; a beat too narrow for that tucks it on the head's
        // top-right corner instead.
        if (note.finger) {
          const fitsBeside = blockW - headW >= FINGER_R * 2 + 6;
          const fx = fitsBeside ? blockX + headW + 3 + FINGER_R : blockX + headW - 1;
          const fy = fitsBeside ? note.noteY : blockY + 1;
          drawFingerBadge(note.finger, fx, fy, baseAlpha);
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
        if (note.isAccented) {
          ctx.font = TECHNIQUE_FONT;
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
            // Just clear of the heads, so the arc rests on them instead of digging in.
            const slurY = note.noteY - BLOCK_H / 2 - 2;
            // On the top string a full arc and its letter would climb into the
            // rhythm lane: the arc stays flat there, and the letter goes between
            // the two heads instead — where there is room for it.
            const tucked = slurY < STAFF_TOP + STRING_SPACING / 2 && x1 - x0 - headW >= HP_TUCK_ROOM;
            const arcH = tucked ? 10 : Math.min(28, Math.max(16, (x1 - x0) * 0.4));

            ctx.strokeStyle = hpColor;
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(x0, slurY);
            ctx.quadraticCurveTo(midX, slurY - arcH, x1, slurY);
            ctx.stroke();

            // Label at apex of arc
            // A quadratic peaks halfway to its control point — the label sits on
            // that apex, not up at the control point where it floated loose.
            ctx.fillStyle = hpColor;
            ctx.font = HP_FONT;
            ctx.textAlign = "center";
            ctx.textBaseline = tucked ? "middle" : "bottom";
            drawText(label, midX, tucked ? note.noteY - 1 : slurY - arcH / 2 - 3);
          } else {
            // No previous note visible – fallback to label above block
            ctx.fillStyle = hpColor;
            ctx.font = HP_FONT;
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            drawText(label, labelX, blockY - 3);
          }
        }
        if (note.isTap) {
          // A tapped note is the one the other hand plays, so it has to be
          // picked out before it reaches the cursor: a ring in the board's ink
          // round the head, and a small "T" tab on its top-left corner — on
          // the head itself, where the fret is read, and clear of the slur
          // that leaves from the head's middle. Never green: that is a hit.
          // (It used to be a 9 px green "T" at the far end of the note's tail,
          // which in a fast run sat on the next note instead.)
          ctx.globalAlpha = baseAlpha * 0.92;
          ctx.strokeStyle = inkColor;
          ctx.lineWidth = 1.5;
          drawPill(blockX - 3, blockY - 3, headW + 6, BLOCK_H + 6, BLOCK_CORNER + 3);
          ctx.stroke();
          ctx.globalAlpha = baseAlpha;
          ctx.fillStyle = inkColor;
          ctx.strokeStyle = bgColor;
          drawPill(blockX - 3, blockY - 7, TAP_TAB_W, TAP_TAB_H, 3);
          ctx.fill();
          ctx.stroke();
          const baseline = ctx.textBaseline;
          ctx.font = TECHNIQUE_FONT;
          ctx.fillStyle = bgColor;
          ctx.textBaseline = "middle";
          drawText("T", blockX - 3 + TAP_TAB_W / 2, blockY - 7 + TAP_TAB_H / 2 + 0.5);
          ctx.textBaseline = baseline;
          ctx.globalAlpha = 1;
        }

        // Harmonic badge
        if (isHarm) {
          ctx.font = "bold 8px Inter, sans-serif";
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
          // In the string's own colour, like the slurs; the arrow and the
          // label tell a bend, a pre-bend and a release apart.
          const bgCol = isHit ? "#064e3b" : mixHex(bgColor, note.color, 0.28);
          const txCol = isHit ? "#34d399" : note.color;
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
    }
  }

  // ── Counting — "1 e & a" under each beat ─────────────────────────────────
  // Below the palm-mute row, where nothing else is drawn: over the staff it
  // would run into pick marks, chord names and slur letters. Left out when wide
  // string spacing leaves no room for it on the board.
  const countY = STAFF_TOP + 5 * STRING_SPACING + BLOCK_H / 2 + PM_ROW_GAP + COUNT_ROW_GAP;
  if (showCounting && !hideNotes && countY <= BASE_H - 6) {
    ctx.font = COUNT_FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = startIdx; i < renderBeats.length; i++) {
      const x = xMap.xs[i] + BLOCK_PAD + BLOCK_H / 2;
      if (x > visR) break;
      const count = beatCounts[i];
      if (!count) continue;
      ctx.fillStyle = withAlpha(inkColor, count.onBeat ? 0.7 : 0.4);
      drawText(count.label, x, countY);
    }
  }

  // ── Palm-mute spans ──────────────────────────────────────────────────────
  if (showTechniqueLabels && !hideNotes) {
    for (const run of pmRuns) {
      const runL = xMap.xs[run.start];
      const runR = xMap.xs[run.end + 1];
      if (runR < visL) continue;
      if (runL > visR) break;
      const live = isPlaying && startWallMs !== null && cursorPos >= runL && cursorPos < runR;
      drawPalmMuteSpan(runL + BLOCK_PAD, xMap.xs[run.end] + BLOCK_PAD + BLOCK_H, runR - runL, live);
    }
  }

  // ── Time signature markers ───────────────────────────────────────────────
  if (timeSigMarkers.length > 0) {
    const sigMidY = STAFF_TOP + STRING_SPACING * 2.5;
    // Half the digit stack (two 14px digits ±10 px from the middle) plus half a pill.
    const sigClearance = 17 + BLOCK_H / 2;
    ctx.fillStyle = withAlpha(inkColor, 0.45);
    // Engraved numerals, like the rhythm lane above them; plain digits until
    // (or unless) the music font is in. A SMuFL numeral is two staff spaces tall
    // and centred on its baseline, so the pair stacks one space either side.
    const sigSp = TIME_SIG_PX / 4;
    ctx.font = bravuraReady ? TIME_SIG_FONT : "bold 14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = bravuraReady ? "alphabetic" : "middle";
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
      // The digits land on the bar's opening pill. One poking out below a fret
      // read as a second note — a "4" under a "6" passed for a double stop — so
      // the signature steps aside wherever that first beat has a note under it.
      const opening = hideNotes ? undefined : renderBeats[marker.beatIdx];
      if (opening?.notes.some((n) => Math.abs(n.noteY - sigMidY) < sigClearance)) continue;
      if (bravuraReady) {
        drawText(timeSigGlyph(marker.sig[0]), mx, sigMidY - sigSp);
        drawText(timeSigGlyph(marker.sig[1]), mx, sigMidY + sigSp);
      } else {
        drawText(marker.sig[0].toString(), mx, sigMidY - 10);
        drawText(marker.sig[1].toString(), mx, sigMidY + 10);
      }
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

  if (playUntilX !== null) {
    ctx.restore();
    // A closing double bar where the music stops.
    if (!hideNotes && playUntilX >= viewL && playUntilX <= viewR) {
      const top = STAFF_TOP;
      const bottom = STAFF_TOP + 5 * STRING_SPACING;
      ctx.strokeStyle = withAlpha(inkColor, 0.55);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(playUntilX - 6, top); ctx.lineTo(playUntilX - 6, bottom); ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(playUntilX - 1.5, top); ctx.lineTo(playUntilX - 1.5, bottom); ctx.stroke();
    }
  }

  // ── Progress overlay — played notes fade out into the backdrop to the left ──
  // A left→right gradient over the already-played span: near-opaque at the left
  // edge (notes dissolve into the #09090b viewer background as they scroll off)
  // easing to fully transparent at the cursor, so the note just played stays
  // perfectly readable and only the older notes disappear. Fill only the visible
  // span (viewL..dispCursor) so the rect can't grow unbounded as the monotonic
  // cursor advances across repetitions.
  // On a standing page the same gradient would deepen as the cursor crossed
  // it, so there the played part is simply dimmed evenly.
  if (dispCursor > 0 && pagedScroll && isPlaying) {
    ctx.fillStyle = withAlpha(bgColor, PAGE_PLAYED_DIM);
    ctx.fillRect(viewL, 0, dispCursor - viewL, viewH);
  } else if (dispCursor > 0) {
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
    const selRows = [stringRow(selection.startString, flipStrings, stringCount), stringRow(selection.endString, flipStrings, stringCount)];
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
    // On a whole device pixel too, so the line stays one crisp stroke.
    const cursorX = Math.round(dispCursor * devicePx) / devicePx;
    // Paused it is simply the board's ink — red read as an error. Learn mode
    // keeps no time, so there it rests on the target in the learn colour.
    ctx.strokeStyle = isPlaying ? CURSOR_COLOR : isLearning ? withAlpha(LEARN_COLOR, 0.6) : withAlpha(inkColor, 0.7);
    ctx.lineWidth = isLearning ? 2 : 1.5;
    ctx.beginPath();
    ctx.moveTo(cursorX, 0); ctx.lineTo(cursorX, viewH);
    ctx.stroke();
    // A marker on top of the line, pointing down it.
    if (!isLearning) {
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.moveTo(cursorX - 5, 0); ctx.lineTo(cursorX + 5, 0); ctx.lineTo(cursorX, 7);
      ctx.closePath();
      ctx.fill();
    }

    if (isPlaying && beatsElapsed > 0 && !lite) {
      const bp = beatsElapsed % 1;
      if (bp < 0.3) {
        const ripple = bp * 100;
        const opacity = 1 - bp / 0.3;
        ctx.strokeStyle = `rgba(6,182,212,${opacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cursorX, viewH / 2, ripple, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  ctx.restore();

  // ── Pinned tuning gutter (drawn on top of the scrolled content) ──────────
  // Light the strings at / just ahead of the cursor. wrappedCursor is tile-0
  // pixel space, so the map turns it back into the cursor beat.
  if (withGutter) drawTuningGutter(activeTuningStrings(xToBeat(xMap, wrappedCursor)));
  };

  // ── Whole, or only what changed ──────────────────────────────────────────
  const target = canvas;
  const canReuse = target !== null && typeof OffscreenCanvas !== "undefined" && target instanceof OffscreenCanvas;
  const scrollPx = Math.round(scrollX * devicePx);
  let reused = false;
  if (target && canReuse && layoutLeftReach <= REUSE_MAX_REACH && isPlaying && countInRemaining === 0 && learnTarget === null && glide === null && pageTurn === null) {
    const widthPx = target.width;
    const heightPx = target.height;
    // First column with nothing but notes the cursor hasn't reached.
    const aheadPx = Math.max(0, Math.ceil((contentLeft + reachedRight(dispCursor, wrappedCursor) - scrollX) * devicePx) + 1);
    const movedPx = scrollPx - reuseScrollPx;
    // What the last frame drew ahead of the cursor is now movedPx further left.
    const fromPx = Math.max(aheadPx, reuseAheadPx - movedPx);
    // A strip looks this far past its own edges for beats that draw into it;
    // a beat that came into range this frame draws back over columns that
    // scrolled in before it did, and those are drawn again with the new strip.
    const reach = Math.max(REUSE_OVERHANG, layoutLeftReach + 40);
    const backPx = movedPx > 0
      ? Math.ceil(Math.max(0, enteredLeftReach(reuseViewRight, viewR, seamless) - REUSE_FREE_REACH) * devicePx)
      : 0;
    const stripPx = Math.max(fromPx, widthPx - movedPx - backPx);
    const keptPx = stripPx - fromPx;
    // A standing page only ever turns, and a turn redraws it.
    if (reuseValid && movedPx >= 0 && (!pagedScroll || movedPx === 0) && keptPx >= Math.max(REUSE_MIN_STATIC_PX, Math.ceil(reach * devicePx))) {
      const toWorld = (px: number) => px / devicePx - contentLeft + scrollX;
      if (movedPx > 0) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.beginPath();
        ctx.rect(fromPx, 0, keptPx, heightPx);
        ctx.clip();
        ctx.globalCompositeOperation = "copy";
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(target, fromPx + movedPx, 0, keptPx, heightPx, fromPx, 0, keptPx, heightPx);
        ctx.restore();
      }
      const strips: [number, number][] = movedPx > 0 ? [[0, fromPx], [stripPx, widthPx]] : [[0, fromPx]];
      for (const [x0, x1] of strips) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.beginPath();
        ctx.rect(x0, 0, x1 - x0, heightPx);
        ctx.clip();
        drawBoard(
          x0 === 0 ? viewL : Math.max(viewL, toWorld(x0) - reach),
          x1 === widthPx ? viewR : Math.min(viewR, toWorld(x1) + reach),
          x0 === 0,
        );
        ctx.restore();
      }
      reused = true;
    }
    reuseAheadPx = aheadPx;
    reuseValid = true;
  } else {
    reuseValid = false;
  }
  reuseScrollPx = scrollPx;
  reuseViewRight = viewR;
  if (!reused) drawBoard(viewL, viewR, true);

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

function render(frameStamp?: number) {
  rafId = requestAnimationFrame(render);
  const stamped = frameStamp !== undefined && Number.isFinite(frameStamp);
  const running = isPlaying && isVisible && countInRemaining === 0;
  if (stamped && running) {
    if (lite) {
      // Every other frame of a 60 Hz screen, every fourth of a 120 Hz one.
      if (frameStamp - lastLitePaintStamp < LITE_FRAME_MS - LITE_FRAME_SLACK_MS) return;
      lastLitePaintStamp = frameStamp;
    } else if (observeFrame(framePace, frameStamp)) {
      // The frames aren't keeping up: let whoever owns the board decide (a
      // phone goes lite; a desktop leaves it alone).
      self.postMessage({ type: 'SLOW_FRAMES' });
    }
  } else if (!running) {
    resetFramePace(framePace);
    lastLitePaintStamp = Number.NEGATIVE_INFINITY;
  }
  try {
    paintFrame(frameStamp);
  } catch (err) {
    // A frame that threw between save and restore leaves its clip, transform and
    // state stack behind, and every later frame would draw under them. Drop them
    // and repaint next frame; the error still surfaces.
    ctx?.reset?.();
    needsRedraw = true;
    reuseValid = false;
    throw err;
  }
}

/** Puts up the Early/Late label of every timing in `next` the board hasn't
 *  shown yet — `next` being all the timings, or only the ones that changed. */
function labelNewTimings(next: Record<string, NoteTiming>) {
  if (!timingHints) return;
  const now = Date.now();
  // Compared by value: every message arrives as freshly cloned objects.
  // A note hit again in a later pass with a new timing gets a new label.
  for (const key of Object.keys(next)) {
    const t = next[key];
    const prev = noteTimings[key];
    if (!t.hint) continue;
    if (prev && prev.hint === t.hint && prev.offsetBeats === t.offsetBeats) continue;
    // Already put up when the hit streamed in.
    if (isLiveTiming(liveFills.byKey.get(key), t)) continue;
    timingLabels.set(key, { kind: t.hint, at: now });
  }
}

// ── Message handler ───────────────────────────────────────────────────────────
self.onmessage = (e: MessageEvent) => {
  const msg = e.data as { type: string;[k: string]: any };
  needsRedraw = true; // any incoming message requires at least one repaint
  if (!REUSE_SAFE_MESSAGES.has(msg.type)) reuseValid = false;

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
      tailFades.clear();
      ctx.setTransform(dpr * vscale, 0, 0, dpr * vscale, 0, 0);
      // The GPU dropped the context and gave it back blank: repaint even while
      // paused, and rebuild the cached bitmaps, which may have been lost with it.
      canvas.addEventListener?.('contextrestored', () => {
        hitGlowSprites.clear();
        chordTagSprites.clear();
        sparkHalos.clear();
        needsRedraw = true;
        reuseValid = false;
      });
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
      pmRuns = palmMuteRuns(renderBeats);
      measureEndXs = msg.measureEndXs;
      totalBeats = msg.totalBeats;
      hasAccentedNotes = msg.hasAccentedNotes;
      hasDynamics = msg.hasDynamics;
      timeSigMarkers = msg.timeSigMarkers ?? [];
      beatCounts = beatCountLabels(renderBeats, measureEndXs, timeSigMarkers);
      beatTickBeats = beatTickPositions(measureEndXs, timeSigMarkers);
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
    case 'PLAY_UNTIL': {
      playUntilBeat = typeof msg.beat === 'number' && Number.isFinite(msg.beat) ? msg.beat : null;
      needsRedraw = true;
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
    case 'HIT_NOTES_PATCH': {
      applyHitPatch(visual, msg.hitNotes as Record<string, boolean | number>, Date.now());
      break;
    }
    case 'NOTE_TIMINGS': {
      const next = msg.noteTimings as typeof noteTimings;
      labelNewTimings(next);
      noteTimings = next;
      break;
    }
    case 'NOTE_TIMINGS_PATCH': {
      const patch = msg.noteTimings as typeof noteTimings;
      labelNewTimings(patch);
      for (const key of Object.keys(patch)) noteTimings[key] = patch[key];
      break;
    }
    case 'MISSED_NOTES': {
      applyMissedNotes(visual, msg.missedNotes as Record<string, boolean>, lastFinishedTile);
      needsRedraw = true;
      break;
    }
    case 'MISSED_NOTES_PATCH': {
      applyMissedPatch(visual, msg.missedNotes as Record<string, boolean>);
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
      if (msg.stringCount !== undefined && msg.stringCount !== stringCount) {
        stringCount = msg.stringCount;
      }
      if (msg.rightToLeft !== undefined) rightToLeft = msg.rightToLeft;
      if (msg.pagedScroll !== undefined) pagedScroll = msg.pagedScroll;
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
      if (msg.showCounting !== undefined) showCounting = msg.showCounting;
      if (msg.showTechniqueLabels !== undefined) showTechniqueLabels = msg.showTechniqueLabels;
      if (msg.hitAnimations !== undefined) hitAnimations = msg.hitAnimations;
      if (msg.lite !== undefined && msg.lite !== lite) {
        lite = msg.lite;
        tailFades.clear();
        resetFramePace(framePace);
      }
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
