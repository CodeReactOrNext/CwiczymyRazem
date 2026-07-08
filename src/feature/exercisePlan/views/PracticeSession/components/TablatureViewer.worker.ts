/// <reference lib="webworker" />

// ── Layout constants ──────────────────────────────────────────────────────────
const STRING_SPACING = 32;
const BLOCK_H = 22;   // pill height (same as old NOTE_RADIUS*2)
const BLOCK_CORNER = 5;    // rounded corner radius
const BLOCK_GAP = 4;    // gap between consecutive block right edges and next beat
const BLOCK_PAD = 4;    // left padding from beat start
const NOTE_RADIUS = BLOCK_H / 2; // kept for badge connector math
const STAFF_TOP = 62;
const STEM_TOP_Y = 12;
const RHY_HEAD_Y = STAFF_TOP - 36;
const RHY_HEAD_R = 3.5;
const BEAM_H = 3;
const BEAM_GAP = 4.5;
const RHYTHM_COLOR = "rgba(255,255,255,0.4)";

const STRING_COLORS = [
  "#f87171", "#fb923c", "#facc15", "#4ade80", "#60a5fa", "#c084fc",
] as const;

// Staff lines batched into 3 alpha groups (pairs: 0+5, 1+4, 2+3)
const STAFF_LINE_GROUPS: { alpha: number; indices: number[] }[] = [
  { alpha: 0.45, indices: [0, 5] },
  { alpha: 0.33, indices: [1, 4] },
  { alpha: 0.21, indices: [2, 3] },
];

// ── Shared types (mirrored from TablatureViewer.tsx) ──────────────────────────
interface NoteRD {
  noteKey: string;
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
}

interface TimeSigMarker { x: number; sig: [number, number]; }
interface TupletGroup { x1: number; x2: number; num: number; }
interface TempoPoint { beatPos: number; ratio: number; }

// ── Worker state ──────────────────────────────────────────────────────────────
let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
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

// Horizontal zoom multiplier applied to the base beat-width (1 = default).
// <1 compresses the score so more of it fits on screen; >1 enlarges it.
let zoom = 1;

// Playback
let isPlaying = false;
let startWallMs: number | null = null;
let bpm = 120;
let countInRemaining = 0;

// Audio-clock sync (AudioContext.currentTime sent from main thread each rAF)
let audioStartSec: number | null = null;
let audioCurrentSec: number | null = null;

// Visual state
let hitNotes: Record<string, boolean | number> = {};
let missedNotes: Record<string, boolean> = {};
let hideNotes = false;

// Frozen snapshot of the finishing repetition's hit/miss state. When the full
// exercise loops, useNoteMatching clears hitNotes/missedNotes at the wrap; we keep
// the previous pass's state so the outgoing tail (the repetition scrolling off to
// the left) stays painted as played instead of "restarting" to raw.
let frozenHitNotes: Record<string, boolean | number> = {};
let frozenMissedNotes: Record<string, boolean> = {};
let hasFrozen = false;
// Tile index the frozen snapshot belongs to, captured from the visual cursor at
// freeze time. Matching resets ~one input-latency before the visual wrap, so we
// pin the tile at reset time to keep the tail painted through that gap.
let frozenTile = -1;
let lastActiveTile = 0;

// Hit animation timestamps — noteKey → wall-clock ms when note was first hit
const HIT_ANIM_MS = 320;
let hitTimestamps: Record<string, number> = {};

// Visual cache for progressive fills to prevent backward snapping during latency variance
const noteVisualFill = new Map<string, number>();

// ── Performance: module-level reuse ──────────────────────────────────────────
// Reused each frame instead of allocating a new Map on every rAF tick
const stringLastPos = new Map<number, { x: number; cx: number; y: number; slideOut: number }>();
// Dirty flag — skip rAF paint when nothing changed (paused, no animations)
let needsRedraw = true;
// Counter for active hit animations — avoids Object.keys() in the hot render path
let hitTimestampsCount = 0;
// Cache for bend badge text widths — ctx.measureText is expensive, text never changes
const bendTextWidthCache = new Map<string, number>();
// Wall-clock time (ms) at which the last TICK was received — used for interpolation
let audioCurrentReceivedAt: number | null = null;

// Scrub/pause position (writable by SCROLL message when paused)
let pausedCursorPos = 0;
let pausedScrollX = 0;

// Hover preview — world-X of the measure start being hovered (null = no hover)
let hoverStartX: number | null = null;

// Sub-loop range in beats (null = full song loop)
let loopStartBeat: number | null = null;
let loopEndBeat:   number | null = null;

// Rest-active state — track changes to avoid flooding main thread
let lastRestActive = false;

// Whether user is playing sound during a rest (set by main thread)
let showRestWarning = false;

// Lighten a "#rrggbb" colour toward white by `amt` (0..1). Non-hex passes through.
function lightenHex(hex: string, amt: number): string {
  if (hex.length !== 7 || hex[0] !== "#") return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
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
  ctx.fillText(fullText, bx, by + 1);

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

// ── Rounded rectangle (pill) helper ──────────────────────────────────────────
function drawPill(x: number, y: number, w: number, h: number, r: number) {
  if (!ctx || w <= 0 || h <= 0) return;
  const cr = Math.max(0, Math.min(r, h / 2, w / 2));
  ctx.beginPath();
  ctx.moveTo(x + cr, y);
  ctx.lineTo(x + w - cr, y);
  ctx.arcTo(x + w, y, x + w, y + cr, cr);
  ctx.lineTo(x + w, y + h - cr);
  ctx.arcTo(x + w, y + h, x + w - cr, y + h, cr);
  ctx.lineTo(x + cr, y + h);
  ctx.arcTo(x, y + h, x, y + h - cr, cr);
  ctx.lineTo(x, y + cr);
  ctx.arcTo(x, y, x + cr, y, cr);
  ctx.closePath();
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

  // Skip paint when paused and nothing animating
  if (!isPlaying && !needsRedraw && hitTimestampsCount === 0) {
    if (lastRestActive) {
      lastRestActive = false;
      self.postMessage({ type: 'REST_ACTIVE', isRest: false });
    }
    return;
  }
  needsRedraw = false;

  const dynBW = Math.max(120, Math.min(200, W / 4)) * zoom;
  const totalW = totalBeats * dynBW;
  let dispCursor = pausedCursorPos;     // display cursor world-x (monotonic while seamless looping)
  let scrollX = pausedScrollX;
  let beatsElapsed = 0;
  let wrappedCursor = pausedCursorPos;  // cursor within a single repetition (tile-0 space)
  let seamless = false;                 // full-exercise seamless wrap active this frame

  if (isPlaying && countInRemaining === 0) {
    // Interpolate audio time between infrequent TICK messages using wall clock
    const audioNow = (audioCurrentSec !== null && audioCurrentReceivedAt !== null)
      ? audioCurrentSec + (Date.now() - audioCurrentReceivedAt) / 1000
      : null;
    const elapsed = (audioStartSec !== null && audioNow !== null)
      ? (audioNow - audioStartSec)
      : startWallMs !== null ? (Date.now() - startWallMs) / 1000 : 0;
    beatsElapsed = computeBeatsElapsed(elapsed);

    if (loopStartBeat !== null && loopEndBeat !== null && loopEndBeat > loopStartBeat
        && beatsElapsed >= loopStartBeat) {
      // Sub-loop: keep the existing jump-back behavior within the selected range
      const loopDur = loopEndBeat - loopStartBeat;
      const relBeat = beatsElapsed - loopStartBeat;
      const loopBeat = loopStartBeat + (relBeat % loopDur);
      dispCursor = loopBeat * dynBW;
      wrappedCursor = dispCursor;
    } else {
      // Full-exercise loop: monotonic cursor + tiled score so the ribbon scrolls
      // continuously into the next repetition with no snap-back.
      seamless = totalBeats > 0;
      dispCursor = beatsElapsed * dynBW;
      wrappedCursor = (totalBeats > 0 ? beatsElapsed % totalBeats : 0) * dynBW;
    }
    scrollX = Math.max(0, dispCursor - W / 4);
    // Pause/seek anchor stays within a single repetition (tile-0 space)
    pausedCursorPos = wrappedCursor;
    pausedScrollX = Math.max(0, wrappedCursor - W / 4);
  }

  const viewL = scrollX - 50;
  const viewR = scrollX + W + 50;
  const tileStart = seamless && totalW > 0 ? Math.max(0, Math.floor(viewL / totalW)) : 0;
  const tileEnd   = seamless && totalW > 0 ? Math.floor(viewR / totalW) : 0;
  // Repetition the cursor is currently in — the one just before it is the
  // outgoing tail that should keep the previous pass's frozen hit/miss state.
  const activeTile = seamless && totalW > 0 ? Math.floor(dispCursor / totalW) : 0;
  lastActiveTile = activeTile;

  // ── Clear & translate ────────────────────────────────────────────────────
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(-scrollX, 0);

  // ── Staff lines — 3 batched groups (drawn once across the viewport) ──────
  if (!hideNotes) {
    const lineL = Math.max(0, scrollX);
    const lineR = seamless ? scrollX + W + 10 : Math.min(totalW, scrollX + W + 10);
    ctx.lineWidth = 1;
    for (const grp of STAFF_LINE_GROUPS) {
      ctx.strokeStyle = `rgba(255,255,255,${grp.alpha})`;
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
    const isOutgoing = seamless && hasFrozen && tile === frozenTile;
    const tileHit = isOutgoing ? frozenHitNotes : hitNotes;
    const tileMissed = isOutgoing ? frozenMissedNotes : missedNotes;
    ctx.save();
    ctx.translate(tileOff, 0);

  // ── Measure lines — single batched path ─────────────────────────────────
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, STAFF_TOP); ctx.lineTo(0, STAFF_TOP + 5 * STRING_SPACING);
  // Binary search for first visible measure bar, then scan forward
  if (measureEndXs.length > 0) {
    let lo = 0, hi = measureEndXs.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (measureEndXs[mid] * dynBW < visL) lo = mid + 1; else hi = mid;
    }
    for (let mi = lo; mi < measureEndXs.length; mi++) {
      const x = measureEndXs[mi] * dynBW;
      if (x > visR) break;
      ctx.moveTo(x, STAFF_TOP); ctx.lineTo(x, STAFF_TOP + 5 * STRING_SPACING);
    }
  }
  ctx.stroke();

  // Track last rendered note pos per string for slide lines: string# → { x, y, slideOut }
  stringLastPos.clear();

  // Binary search for first visible beat, then scan forward
  let startIdx = 0;
  if (renderBeats.length > 0) {
    let lo = 0, hi = renderBeats.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      const beatEndPx = (renderBeats[mid].offsetX + renderBeats[mid].duration) * dynBW;
      if (beatEndPx < visL) lo = mid + 1; else hi = mid;
    }
    startIdx = lo;
  }

  // ── Beat loop ────────────────────────────────────────────────────────────
  for (let i = startIdx; i < renderBeats.length; i++) {
    const beat = renderBeats[i];
    const beatPx = beat.offsetX * dynBW;
    const beatEndPx = beatPx + beat.duration * dynBW;
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

    // Rhythm notation
    if (inView) {
      const dur = beat.duration;
      ctx.strokeStyle = RHYTHM_COLOR;
      ctx.fillStyle = RHYTHM_COLOR;

      if (beat.isRest) {
        const warnThisBeat = showRestWarning && isActive;
        if (warnThisBeat) {
          // Subtle amber column tint
          ctx.fillStyle = "rgba(251,191,36,0.07)";
          ctx.fillRect(beatPx, 0, beat.duration * dynBW, H);
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
          ctx.fillText("!", beatL, STEM_TOP_Y - 8);
          // Reset colors
          ctx.strokeStyle = RHYTHM_COLOR;
          ctx.fillStyle = RHYTHM_COLOR;
        }
      } else if (dur >= 4.0) {
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(beatL, RHY_HEAD_Y, RHY_HEAD_R * 1.5, RHY_HEAD_R, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(beatL, RHY_HEAD_Y - RHY_HEAD_R);
        ctx.lineTo(beatL, STEM_TOP_Y);
        ctx.stroke();

        if (dur >= 2.0) {
          ctx.beginPath();
          ctx.arc(beatL, RHY_HEAD_Y, RHY_HEAD_R, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(beatL, RHY_HEAD_Y, RHY_HEAD_R, 0, Math.PI * 2);
          ctx.fill();

          const flags = dur < 0.25 ? 3 : dur < 0.5 ? 2 : dur < 1.0 ? 1 : 0;
          for (let f = 0; f < flags; f++) {
            const beamY = STEM_TOP_Y + f * (BEAM_H + BEAM_GAP);
            const drawRight = f === 0 ? beat.beamRight : beat.beamRight2;
            const leftBeam = f === 0 ? beat.prevBeamRight : beat.prevBeamRight2;

            if (drawRight) {
              ctx.fillStyle = RHYTHM_COLOR;
              ctx.fillRect(beatL, beamY, beat.duration * dynBW, BEAM_H);
            } else if (!leftBeam) {
              ctx.strokeStyle = RHYTHM_COLOR;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(beatL, beamY);
              ctx.bezierCurveTo(beatL + 10, beamY + 3, beatL + 8, beamY + 8, beatL + 2, beamY + 12);
              ctx.stroke();
            }
          }
        }
      }
    }

    // Notes
    if (inView && !hideNotes) {
      // Block coordinates — same for all notes in this beat
      const blockX = beatPx + BLOCK_PAD;
      const rawW = beat.duration * dynBW - BLOCK_PAD - BLOCK_GAP;
      const blockW = Math.max(BLOCK_H, rawW); // min size = square pill for tiny notes
      const blockRX = blockX + blockW;         // right edge (for slide tracking)

      // Badge Y: above the topmost block in this beat
      const bendBadgeY = beat.topNoteY - BLOCK_H / 2 - 28;

      for (const note of beat.notes) {
        const hitVal = reached ? tileHit[note.noteKey] : undefined;
        const isHit = !!hitVal;
        const isDead = note.isDead;
        const isHarm = !!(note.harmonicType && note.harmonicType > 0);
        const dyn = hasDynamics && note.dynamics !== undefined ? note.dynamics : 1.0;
        const ghostAlpha = 1.0; // Disabled transparency for ghost notes
        const accentDim = hasAccentedNotes && !note.isAccented ? 0.25 : 1.0;
        const dynAlpha = hasDynamics && note.dynamics !== undefined ? 0.3 + 0.7 * dyn : 1.0;
        const missedDim = reached && !tileHit[note.noteKey] && tileMissed[note.noteKey] ? 0.2 : 1.0;
        const baseAlpha = dynAlpha * accentDim * ghostAlpha * missedDim;

        const blockY = note.noteY - BLOCK_H / 2;
        // Label sits in the "head" — left portion of block, capped at block center for narrow blocks
        const labelX = blockX + Math.min(blockW / 2, BLOCK_H * 0.65);

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
          ctx.strokeStyle = STRING_COLORS[Math.round((note.noteY - STAFF_TOP) / STRING_SPACING)] ?? "#fff";
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
        const finalHitColor = "#10b981";
        const isAnimatingHit = isHit && hitTimestamps[note.noteKey] !== undefined;

        if (!isHit && note.isPalmMute) fillColor = "#78716c";
        else if (!isHit && isDead) fillColor = "#374151";
        // Active/hit notes get a lighter block instead of a white digit.
        else if (isActive || isHit) fillColor = lightenHex(note.color, 0.72);

        // ── Active glow — translucent ring behind block ───────────────────
        if (isActive && !isHit) {
          ctx.fillStyle = note.color;
          ctx.globalAlpha = ghostAlpha * 0.12;
          drawPill(blockX - 6, blockY - 6, blockW + 12, BLOCK_H + 12, BLOCK_CORNER + 5);
          ctx.fill();
          ctx.globalAlpha = ghostAlpha * 0.22;
          drawPill(blockX - 3, blockY - 3, blockW + 6, BLOCK_H + 6, BLOCK_CORNER + 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        // ── Draw pill block ──────────────────────────────────────────────
        let hitAge = 0;
        if (isAnimatingHit) {
          hitAge = Math.min(1, (Date.now() - hitTimestamps[note.noteKey]) / HIT_ANIM_MS);
        }

        let fillW = 0;
        if (isHit && isOutgoing && tile < activeTile) {
          // Frozen tail strictly behind the cursor: keep notes fully filled and
          // never touch the live cache (its note key is shared with other tiles).
          // The gap frame where the frozen tile is still the active tile falls
          // through to the progressive path so the active note keeps filling.
          fillW = blockW;
        } else if (isHit) {
          const currentVisualFill = noteVisualFill.get(note.noteKey) || 0;
          // ~250ms slack covers typical latency + 50ms React state interval
          const slackX = (250 / 60000) * (bpm || 120) * dynBW;
          const limitX = typeof hitVal === 'number' ? hitVal * dynBW : cursorPos;
          
          let optimisticTarget = 0;
          if (cursorPos - limitX <= slackX) {
            // Optimistic tracking: as long as limitX is close enough to cursor, assume it's still held
            optimisticTarget = cursorPos - blockX;
          } else {
            // Note dropped: cap at actual drop point + slack (preventing backward visual snap)
            optimisticTarget = limitX - blockX + slackX;
          }
          
          fillW = Math.max(0, Math.min(blockW, Math.max(currentVisualFill, optimisticTarget)));
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
          ctx.strokeStyle = isHit ? "#10b981" : col;
          ctx.lineWidth = 2;
          ctx.fillStyle = (isHit ? "#10b981" : col) + "22";
          drawPill(blockX, blockY, blockW, BLOCK_H, BLOCK_CORNER);
          ctx.fill();
          ctx.stroke();
          ctx.globalAlpha = 1;

          // Progressive fill for harmonic
          if (fillW > 0) {
            ctx.save();
            drawPill(blockX, blockY, blockW, BLOCK_H, BLOCK_CORNER);
            ctx.clip();
            ctx.fillStyle = "rgba(16, 185, 129, 0.4)";
            ctx.fillRect(blockX, blockY, fillW, BLOCK_H);
            ctx.restore();
          }

        } else {
          ctx.globalAlpha = isHit ? 1.0 : baseAlpha;
          ctx.fillStyle = fillColor;

          // Glow behind the pill for fresh hits
          if (isAnimatingHit && hitAge < 0.55) {
            const glowStr = 1 - hitAge / 0.55;
            ctx.shadowColor = '#34d399';
            ctx.shadowBlur = glowStr * 20;
          }

          drawPill(blockX, blockY, blockW, BLOCK_H, BLOCK_CORNER);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Subtle inner highlight (lighter strip on top half)
          if (!isDead) {
            ctx.fillStyle = "rgba(255,255,255,0.14)";
            drawPill(blockX + 1, blockY + 1, blockW - 2, BLOCK_H / 2 - 1, BLOCK_CORNER);
            ctx.fill();
          }
          
          // Progressive filling with green tied to the playback cursor
          if (fillW > 0) {
            ctx.save();
            drawPill(blockX, blockY, blockW, BLOCK_H, BLOCK_CORNER);
            ctx.clip();
            
            // The solid green fill
            ctx.fillStyle = finalHitColor;
            ctx.fillRect(blockX, blockY, fillW, BLOCK_H);
            
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
            
            // Inner highlight for the filled green part
            if (fillW > 2) {
              ctx.fillStyle = "rgba(255,255,255,0.2)";
              drawPill(blockX, blockY + 1, fillW - 1, BLOCK_H / 2 - 1, BLOCK_CORNER);
              ctx.fill();
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

        // ── Hit animation (Block Shockwave + Sweet Flash) ───────────────────────
        if (isAnimatingHit) {
          const eased = 1 - (1 - hitAge) * (1 - hitAge); // Quad ease-out

          // White flash over whole pill at start
          if (hitAge < 0.2) {
            const flashA = (1 - hitAge / 0.2) * 0.7;
            ctx.globalAlpha = flashA;
            ctx.fillStyle = "#ffffff";
            drawPill(blockX, blockY, blockW, BLOCK_H, BLOCK_CORNER);
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          // Shockwave 1 — pill outline expanding outwards
          const exp1 = eased * 8; // expands by 8px
          const a1 = (1 - hitAge) * 0.8;
          ctx.strokeStyle = `rgba(52,211,153,${a1})`;
          ctx.lineWidth = Math.max(0.5, 3 * (1 - hitAge));
          drawPill(blockX - exp1, blockY - exp1, blockW + exp1 * 2, BLOCK_H + exp1 * 2, BLOCK_CORNER + exp1);
          ctx.stroke();

          // Shockwave 2 — delayed, smaller outline
          if (hitAge > 0.15) {
            const age2 = (hitAge - 0.15) / 0.85;
            const eased2 = 1 - (1 - age2) * (1 - age2);
            const exp2 = eased2 * 5;
            const a2 = (1 - age2) * 0.4;
            ctx.strokeStyle = `rgba(16,185,129,${a2})`;
            ctx.lineWidth = Math.max(0.5, 2 * (1 - age2));
            drawPill(blockX - exp2, blockY - exp2, blockW + exp2 * 2, BLOCK_H + exp2 * 2, BLOCK_CORNER + exp2);
            ctx.stroke();
          }

          if (hitAge >= 1) { delete hitTimestamps[note.noteKey]; hitTimestampsCount--; }
        }

        // ── Fret label ────────────────────────────────────────────────────
        if (!isDead) {
          const fs = hasDynamics ? Math.max(9, Math.round(13 * (0.75 + 0.25 * dyn))) : 13;
          ctx.fillStyle = "#000000";
          ctx.font = `bold ${fs}px Inter, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          let text = note.fret.toString();
          if (note.isGhost) text = `(${text})`;
          ctx.fillText(text, labelX, note.noteY);
        }

        // ── Technique labels ──────────────────────────────────────────────
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 9px Inter";
        if (note.isAccented) {
          ctx.fillStyle = "rgba(255,255,255,0.75)";
          ctx.fillText(">", labelX, blockY - 6);
        }
        if (note.isHammerOn || note.isPullOff) {
          const isHP = note.isHammerOn;
          const hpColor = isHit ? "#34d399" : note.color;
          const label = isHP ? "H" : "P";

          if (prev && blockX - prev.x > 4) {
            // Draw slur arc from centre of previous block to centre of this block
            const x0 = prev.cx;
            const x1 = blockX + blockW / 2;
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
            ctx.fillText(label, midX, slurY - arcH - 3);
          } else {
            // No previous note visible – fallback to label above block
            ctx.fillStyle = hpColor;
            ctx.font = "bold 12px Inter";
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillText(label, blockX + blockW / 2, blockY - 3);
          }
        }
        if (note.isTap) {
          ctx.fillStyle = isHit ? "#064e3b" : "#34d399";
          ctx.fillText("T", blockRX - 7, blockY - 6);
        }

        // Harmonic badge
        if (isHarm) {
          ctx.font = "bold 8px Inter";
          ctx.fillStyle = note.harmonicType === 1 ? "#a3e635" : "#f0abfc";
          const hLabel = note.harmonicType === 1 ? "N.H." : note.harmonicType === 2 ? "A.H."
            : note.harmonicType === 3 ? "T.H." : note.harmonicType === 4 ? "P.H." : "S.H.";
          ctx.fillText(hLabel, labelX, note.noteY);
        }

        // Palm mute label below block
        if (note.isPalmMute) {
          ctx.font = "bold 7px Inter";
          ctx.fillStyle = "#a8a29e";
          ctx.textAlign = "left";
          ctx.fillText("PM", blockX + 3, blockY + BLOCK_H + 8);
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
          const trailEnd = Math.min(blockRX + 60, blockRX + beat.duration * dynBW * 1.5);
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

        // Vibrato – wavy coloured outline over the block
        if (note.isVibrato) {
          const vibratoColor = isHit ? "#34d399" : note.color;
          const cr = Math.min(BLOCK_CORNER, BLOCK_H / 2, blockW / 2);
          const innerW = blockW - 2 * cr;
          const cycles = Math.max(2, Math.round(innerW / 7));
          const amp = 2.5;
          const vstep = 6; // sample every 6px instead of 1px — ~6× fewer path points

          ctx.strokeStyle = vibratoColor;
          ctx.lineWidth = 2.5;
          ctx.lineJoin = "round";
          ctx.lineCap = "round";
          ctx.beginPath();

          // Top-left arc → top edge
          ctx.moveTo(blockX + cr, blockY);
          for (let i = vstep; i < innerW; i += vstep) {
            ctx.lineTo(blockX + cr + i, blockY + Math.sin((i / innerW) * Math.PI * cycles) * amp);
          }
          ctx.lineTo(blockX + cr + innerW, blockY + Math.sin(Math.PI * cycles) * amp);
          // Top-right corner
          ctx.arcTo(blockX + blockW, blockY, blockX + blockW, blockY + cr, cr);
          // Right edge
          ctx.lineTo(blockX + blockW, blockY + BLOCK_H - cr);
          // Bottom-right corner
          ctx.arcTo(blockX + blockW, blockY + BLOCK_H, blockX + blockW - cr, blockY + BLOCK_H, cr);
          // Bottom edge (wavy, right → left, phase-inverted for ripple effect)
          for (let i = innerW - vstep; i > 0; i -= vstep) {
            ctx.lineTo(blockX + cr + i, blockY + BLOCK_H - Math.sin((i / innerW) * Math.PI * cycles) * amp);
          }
          ctx.lineTo(blockX + cr, blockY + BLOCK_H);
          // Bottom-left corner
          ctx.arcTo(blockX, blockY + BLOCK_H, blockX, blockY + BLOCK_H - cr, cr);
          // Left edge
          ctx.lineTo(blockX, blockY + cr);
          // Back to start
          ctx.arcTo(blockX, blockY, blockX + cr, blockY, cr);
          ctx.closePath();
          ctx.stroke();
        }

        // ── Update slide tracking (right edge of block) ───────────────────
        stringLastPos.set(note.noteY, { x: blockRX, cx: blockX + blockW / 2, y: note.noteY, slideOut: note.slideOut ?? 0 });
      }
    }

    if (beat.chordName && inView) {
      const label = beat.chordName;
      const fSize = 13;
      const padX  = 9;
      const padY  = 4;
      ctx.font         = `bold ${fSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign    = "left";
      ctx.textBaseline = "top";
      const textW  = ctx.measureText(label).width;
      const pillW  = textW + padX * 2;
      const pillH  = fSize + padY * 2;   // 21px
      const arrowH = 5;
      const pillX  = beatPx;
      const pillY  = STAFF_TOP - pillH - arrowH - 22;  // leave gap above rhythm area
      const connX  = pillX + pillW / 2;

      // Glow pass (drawn before the pill so glow stays behind)
      ctx.shadowColor = "rgba(255,255,255,0.45)";
      ctx.shadowBlur  = 8;

      // Pill + downward arrow as one path
      const r = 6;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(pillX + r, pillY);
      ctx.lineTo(pillX + pillW - r, pillY);
      ctx.arcTo(pillX + pillW, pillY,         pillX + pillW, pillY + r,         r);
      ctx.lineTo(pillX + pillW, pillY + pillH - r);
      ctx.arcTo(pillX + pillW, pillY + pillH, pillX + pillW - r, pillY + pillH, r);
      // right half of arrow base → tip → left half
      ctx.lineTo(connX + 5, pillY + pillH);
      ctx.lineTo(connX,     pillY + pillH + arrowH);
      ctx.lineTo(connX - 5, pillY + pillH);
      ctx.lineTo(pillX + r, pillY + pillH);
      ctx.arcTo(pillX,      pillY + pillH, pillX, pillY + pillH - r, r);
      ctx.lineTo(pillX,     pillY + r);
      ctx.arcTo(pillX,      pillY,         pillX + r, pillY,         r);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;

      // Chord label — dark text on white background for maximum contrast
      ctx.fillStyle    = "#0f172a";
      ctx.textAlign    = "left";
      ctx.textBaseline = "top";
      ctx.fillText(label, pillX + padX, pillY + padY);

      // Restore state used by surrounding draw code
      ctx.textBaseline = "middle";
    }
  }

  // ── Time signature markers ───────────────────────────────────────────────
  if (timeSigMarkers.length > 0) {
    const sigMidY = STAFF_TOP + STRING_SPACING * 2.5;
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const marker of timeSigMarkers) {
      const mx = marker.x * dynBW + 10;
      if (mx < visL - 40 || mx > visR) continue;
      ctx.fillText(marker.sig[0].toString(), mx, sigMidY - 10);
      ctx.fillText(marker.sig[1].toString(), mx, sigMidY + 10);
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
    for (const group of tupletGroups) {
      const x1 = group.x1 * dynBW + 8;
      const x2 = group.x2 * dynBW - 8;
      if (x2 < visL || x1 > visR) continue;
      const midX = (x1 + x2) / 2;
      const label = group.num.toString();
      const lw = ctx.measureText(label).width + 6;
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
      ctx.fillText(label, midX, bracketY);
    }
  }

  // ── Dynamics lane ────────────────────────────────────────────────────────
  if (hasDynamics) {
    const DYN_BASE = STAFF_TOP + 5 * STRING_SPACING + 36;
    const DYN_MAX_H = 24;
    const BAR_W = 6;

    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.max(0, visL), DYN_BASE);
    ctx.lineTo(Math.min(totalW, visR), DYN_BASE);
    ctx.stroke();

    for (const beat of renderBeats) {
      const x = beat.offsetX * dynBW + BLOCK_PAD + BLOCK_H * 0.65;
      if (x > visR) break;
      if (x < visL) continue;
      for (const note of beat.notes) {
        if (note.dynamics !== undefined && note.dynamics > 0) {
          const barH = Math.max(2, note.dynamics * DYN_MAX_H);
          const alpha = 0.2 + note.dynamics * 0.8;
          ctx.fillStyle = `rgba(6,182,212,${alpha})`;
          ctx.fillRect(x - BAR_W / 2, DYN_BASE - barH, BAR_W, barH);
        }
      }
    }
  }

    ctx.restore();
  } // end per-tile loop

  // ── Progress overlay — dim everything left of the cursor ─────────────────
  // Fill only the visible span (viewL..dispCursor) so the rect can't grow
  // unbounded as the monotonic cursor advances across repetitions.
  if (dispCursor > 0) {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(viewL, 0, dispCursor - viewL, H);
  }

  // ── Loop range overlay ────────────────────────────────────────────────────
  if (loopStartBeat !== null && loopEndBeat !== null && loopEndBeat > loopStartBeat) {
    const lsx = loopStartBeat * dynBW;
    const lex = loopEndBeat * dynBW;

    // Dim the areas outside the loop range
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(0, 0, lsx, H);
    ctx.fillRect(lex, 0, totalBeats * dynBW - lex, H);

    // Loop boundary lines
    ctx.strokeStyle = "rgba(6,182,212,0.65)";
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(lsx, 0); ctx.lineTo(lsx, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lex, 0); ctx.lineTo(lex, H); ctx.stroke();

    // Small label at the start boundary
    ctx.fillStyle = "rgba(6,182,212,0.55)";
    ctx.font = "bold 9px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("⟳", lsx + 4, 3);
  }

  // ── Hover seek preview — dashed line at measure snap point ───────────────
  if (hoverStartX !== null && !isPlaying) {
    // Dashed vertical line showing where cursor would jump to
    ctx.strokeStyle = "rgba(6,182,212,0.5)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(hoverStartX, 0);
    ctx.lineTo(hoverStartX, H);
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
    for (let i = 0; i < measureEndXs.length; i++) {
      if (measureEndXs[i] * dynBW > hoverStartX + 1) { measureIdx = i; break; }
      measureIdx = i + 1;
    }
    ctx.fillStyle = "rgba(6,182,212,0.65)";
    ctx.font = "bold 10px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`M${measureIdx + 1}`, tx + 12, ty + 1);
  }

  // ── Cursor line + beat pulse ─────────────────────────────────────────────
  if (dispCursor > 0 || isPlaying) {
    ctx.strokeStyle = isPlaying ? "#06b6d4" : "#ef4444";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(dispCursor, 0); ctx.lineTo(dispCursor, H);
    ctx.stroke();

    if (isPlaying && beatsElapsed > 0) {
      const bp = beatsElapsed % 1;
      if (bp < 0.3) {
        const ripple = bp * 100;
        const opacity = 1 - bp / 0.3;
        ctx.strokeStyle = `rgba(6,182,212,${opacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(dispCursor, H / 2, ripple, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  ctx.restore();

  // ── Notify main thread when cursor enters/leaves a rest beat ────────────
  if (isPlaying && countInRemaining === 0) {
    const restActive = renderBeats.some(b =>
      b.isRest && wrappedCursor >= b.offsetX * dynBW && wrappedCursor < (b.offsetX + b.duration) * dynBW
    );
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
      ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(render);
      break;
    }
    case 'RESIZE': {
      dpr = msg.dpr ?? dpr;
      W = msg.width;
      H = msg.height;
      if (canvas) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
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
      loopStartBeat = null;
      loopEndBeat   = null;
      frozenHitNotes = {};
      frozenMissedNotes = {};
      hasFrozen = false;
      recomputeLoopSeconds();
      break;
    }
    case 'PLAYBACK': {
      isPlaying = msg.isPlaying;
      startWallMs = msg.startWallMs;
      bpm = msg.bpm;
      countInRemaining = msg.countInRemaining;
      audioStartSec = msg.audioStartSec ?? null;
      if (!isPlaying) { audioCurrentSec = null; audioCurrentReceivedAt = null; }
      if (isPlaying) hoverStartX = null; // clear hover when playback starts
      recomputeLoopSeconds();
      break;
    }
    case 'HOVER': {
      hoverStartX = msg.startX ?? null;
      break;
    }
    case 'LOOP_RANGE': {
      loopStartBeat = msg.startBeat ?? null;
      loopEndBeat   = msg.endBeat   ?? null;
      break;
    }
    case 'TICK': {
      audioCurrentSec = msg.audioCurrentSec;
      audioCurrentReceivedAt = Date.now();
      break;
    }
    case 'HIT_NOTES': {
      const newHits = msg.hitNotes as Record<string, boolean>;
      const now = Date.now();
      // Hits only ever grow within a pass; a shrink means the loop wrapped and
      // matching reset. Freeze the finishing pass so the outgoing tail stays painted.
      if (Object.keys(newHits).length < Object.keys(hitNotes).length) {
        frozenHitNotes = hitNotes;
        frozenTile = lastActiveTile;
        hasFrozen = true;
      }
      // Record timestamp for notes that are newly hit this frame
      for (const key of Object.keys(newHits)) {
        if (newHits[key] && !hitNotes[key]) {
          if (!hitTimestamps[key]) hitTimestampsCount++;
          hitTimestamps[key] = now;
        }
      }
      // Clear timestamps for notes that got reset (loop restart)
      for (const key of Object.keys(hitTimestamps)) {
        if (!newHits[key]) { delete hitTimestamps[key]; hitTimestampsCount--; }
      }
      hitNotes = newHits;
      break;
    }
    case 'MISSED_NOTES': {
      const newMissed = msg.missedNotes as Record<string, boolean>;
      // Same shrink-detect as hits — freeze the finishing pass's misses for the tail.
      if (Object.keys(newMissed).length < Object.keys(missedNotes).length) {
        frozenMissedNotes = missedNotes;
        frozenTile = lastActiveTile;
        hasFrozen = true;
      }
      missedNotes = newMissed;
      needsRedraw = true;
      break;
    }
    case 'HIDE_NOTES': {
      hideNotes = msg.hideNotes;
      break;
    }
    case 'SCROLL': {
      pausedScrollX = msg.scrollX;
      pausedCursorPos = msg.cursorPos;
      break;
    }
    case 'ZOOM': {
      const next = msg.zoom ?? 1;
      if (next !== zoom && zoom > 0) {
        // pausedCursorPos/pausedScrollX are in pixel-space — rescale so the
        // paused view stays anchored on the same beat after the zoom change.
        const ratio = next / zoom;
        pausedCursorPos *= ratio;
        pausedScrollX *= ratio;
      }
      zoom = next;
      break;
    }
    case 'SHOW_REST_WARNING': {
      showRestWarning = msg.show;
      break;
    }
    case 'RESET': {
      pausedScrollX = 0;
      pausedCursorPos = 0;
      missedNotes = {};
      showRestWarning = false;
      frozenHitNotes = {};
      frozenMissedNotes = {};
      hasFrozen = false;
      // loop range is intentionally NOT cleared here so it survives loop restarts
      break;
    }
    case 'STOP': {
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      break;
    }
  }
};
