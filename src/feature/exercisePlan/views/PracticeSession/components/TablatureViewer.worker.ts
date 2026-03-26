/// <reference lib="webworker" />

// ── Layout constants ──────────────────────────────────────────────────────────
const STRING_SPACING = 32;
const BLOCK_H = 22;   // pill height (same as old NOTE_RADIUS*2)
const BLOCK_CORNER = 5;    // rounded corner radius
const BLOCK_GAP = 4;    // gap between consecutive block right edges and next beat
const BLOCK_PAD = 4;    // left padding from beat start
const NOTE_RADIUS = BLOCK_H / 2; // kept for badge connector math
const STAFF_TOP = 85;
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

// Playback
let isPlaying = false;
let startWallMs: number | null = null;
let bpm = 120;
let countInRemaining = 0;

// Audio-clock sync (AudioContext.currentTime sent from main thread each rAF)
let audioStartSec: number | null = null;
let audioCurrentSec: number | null = null;

// Visual state
let hitNotes: Record<string, boolean> = {};
let missedNotes: Record<string, boolean> = {};
let hideNotes = false;

// Hit animation timestamps — noteKey → wall-clock ms when note was first hit
const HIT_ANIM_MS = 240;
let hitTimestamps: Record<string, number> = {};

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
  if (!ctx) return;
  const cr = Math.min(r, h / 2, w / 2);
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
  if (!isPlaying && !needsRedraw && hitTimestampsCount === 0) return;
  needsRedraw = false;

  const dynBW = Math.max(120, Math.min(200, W / 4));
  let cursorPos = pausedCursorPos;
  let scrollX = pausedScrollX;
  let beatsElapsed = 0;

  if (isPlaying && countInRemaining === 0) {
    // Interpolate audio time between infrequent TICK messages using wall clock
    const audioNow = (audioCurrentSec !== null && audioCurrentReceivedAt !== null)
      ? audioCurrentSec + (Date.now() - audioCurrentReceivedAt) / 1000
      : null;
    const elapsed = (audioStartSec !== null && audioNow !== null)
      ? (audioNow - audioStartSec)
      : startWallMs !== null ? (Date.now() - startWallMs) / 1000 : 0;
    beatsElapsed = computeBeatsElapsed(elapsed);
    const looped = totalBeats > 0 ? beatsElapsed % totalBeats : 0;
    cursorPos = looped * dynBW;
    scrollX = Math.max(0, cursorPos - W / 4);
    // Update paused pos so dragging starts from current position
    pausedCursorPos = cursorPos;
    pausedScrollX = scrollX;
  }

  const totalW = totalBeats * dynBW;
  const visL = scrollX - 50;
  const visR = scrollX + W + 50;

  // ── Clear & translate ────────────────────────────────────────────────────
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(-scrollX, 0);

  // ── Staff lines — 3 batched groups ──────────────────────────────────────
  if (!hideNotes) {
    const lineL = Math.max(0, scrollX);
    const lineR = Math.min(totalW, scrollX + W + 10);
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

  // ── Beat loop ────────────────────────────────────────────────────────────
  for (const beat of renderBeats) {
    const beatPx = beat.offsetX * dynBW;
    const beatEndPx = beatPx + beat.duration * dynBW;
    const beatL = beatPx + 10;

    if (beatL > visR) break;
    if (beatEndPx < visL) continue;

    const inView = beatEndPx >= visL && beatPx <= visR;
    const isActive = isPlaying && startWallMs !== null && cursorPos >= beatPx && cursorPos < beatEndPx;

    // Rhythm notation
    if (inView) {
      const dur = beat.duration;
      ctx.strokeStyle = RHYTHM_COLOR;
      ctx.fillStyle = RHYTHM_COLOR;

      if (beat.isRest) {
        drawRestSymbol(beatL, dur);
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
        const isHit = !!hitNotes[note.noteKey];
        const isDead = note.isDead;
        const isHarm = !!(note.harmonicType && note.harmonicType > 0);
        const dyn = hasDynamics && note.dynamics !== undefined ? note.dynamics : 1.0;
        const ghostAlpha = 1.0; // Disabled transparency for ghost notes
        const accentDim = hasAccentedNotes && !note.isAccented ? 0.25 : 1.0;
        const dynAlpha = hasDynamics && note.dynamics !== undefined ? 0.3 + 0.7 * dyn : 1.0;
        const missedDim = !hitNotes[note.noteKey] && missedNotes[note.noteKey] ? 0.2 : 1.0;
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
        if (isHit) fillColor = "#10b981";
        else if (note.isPalmMute) fillColor = "#78716c";
        else if (isDead) fillColor = "#374151";

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
        } else {
          ctx.globalAlpha = isHit ? 1.0 : baseAlpha;
          ctx.fillStyle = fillColor;

          // Glow behind the pill for fresh hits
          if (isHit && hitTimestamps[note.noteKey] !== undefined) {
            const hitAge = Math.min(1, (Date.now() - hitTimestamps[note.noteKey]) / HIT_ANIM_MS);
            if (hitAge < 0.55) {
              const glowStr = 1 - hitAge / 0.55;
              ctx.shadowColor = '#34d399';
              ctx.shadowBlur = glowStr * 18;
            }
          }

          drawPill(blockX, blockY, blockW, BLOCK_H, BLOCK_CORNER);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Subtle inner highlight (lighter strip on top half)
          if (!isHit && !isDead) {
            ctx.fillStyle = "rgba(255,255,255,0.14)";
            drawPill(blockX + 1, blockY + 1, blockW - 2, BLOCK_H / 2 - 1, BLOCK_CORNER);
            ctx.fill();
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

        // ── Hit animation (expanding rings + flash) ───────────────────────
        const hitTs = hitTimestamps[note.noteKey];
        if (isHit && hitTs !== undefined) {
          const age = Math.min(1, (Date.now() - hitTs) / HIT_ANIM_MS);
          const cx = labelX;
          const cy = note.noteY;
          // Ease-out quad: fast start, smooth finish
          const eased = 1 - (1 - age) * (1 - age);

          // Tight inner ring — brief crisp pop at the very start
          if (age < 0.25) {
            const age0 = age / 0.25;
            const r0 = BLOCK_H / 2 + age0 * 10;
            const a0 = (1 - age0) * 0.55;
            ctx.strokeStyle = `rgba(167,243,208,${a0})`;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(cx, cy, r0, 0, Math.PI * 2);
            ctx.stroke();
          }

          // White flash over pill — sharper and quicker (first 20%)
          if (age < 0.2) {
            const flashA = (1 - age / 0.2) * 0.55;
            ctx.globalAlpha = flashA;
            ctx.fillStyle = "#ffffff";
            drawPill(blockX, blockY, blockW, BLOCK_H, BLOCK_CORNER);
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          // Ring 1 — main ring, ease-out expansion
          const r1 = BLOCK_H / 2 + eased * 28;
          const a1 = (1 - age) * 0.65;
          ctx.strokeStyle = `rgba(52,211,153,${a1})`;
          ctx.lineWidth = Math.max(0.5, 3 * (1 - age));
          ctx.beginPath();
          ctx.arc(cx, cy, r1, 0, Math.PI * 2);
          ctx.stroke();

          // Ring 2 — delayed by 15%, ease-out, slower fade
          if (age > 0.15) {
            const age2 = (age - 0.15) / 0.85;
            const eased2 = 1 - (1 - age2) * (1 - age2);
            const r2 = BLOCK_H / 2 + eased2 * 20;
            const a2 = (1 - age2) * 0.35;
            ctx.strokeStyle = `rgba(16,185,129,${a2})`;
            ctx.lineWidth = Math.max(0.5, 1.5 * (1 - age2));
            ctx.beginPath();
            ctx.arc(cx, cy, r2, 0, Math.PI * 2);
            ctx.stroke();
          }

          if (age >= 1) { delete hitTimestamps[note.noteKey]; hitTimestampsCount--; }
        }

        // ── Fret label ────────────────────────────────────────────────────
        if (!isDead) {
          const fs = hasDynamics ? Math.max(9, Math.round(13 * (0.75 + 0.25 * dyn))) : 13;
          ctx.fillStyle = isActive || isHit ? "#ffffff" : "#000000";
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
      ctx.fillStyle = "#22d3ee";
      ctx.font = "black 22px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(beat.chordName, beatL, STAFF_TOP - 58);
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
    ctx.moveTo(Math.max(0, scrollX), DYN_BASE);
    ctx.lineTo(Math.min(totalW, scrollX + W), DYN_BASE);
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

  // ── Progress overlay — simple fill, no per-frame gradient allocation ─────
  if (cursorPos > 0) {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, cursorPos, H);
  }

  // ── Cursor line + beat pulse ─────────────────────────────────────────────
  if (cursorPos > 0 || isPlaying) {
    ctx.strokeStyle = isPlaying ? "#06b6d4" : "#ef4444";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cursorPos, 0); ctx.lineTo(cursorPos, H);
    ctx.stroke();

    if (isPlaying && beatsElapsed > 0) {
      const bp = beatsElapsed % 1;
      if (bp < 0.3) {
        const ripple = bp * 100;
        const opacity = 1 - bp / 0.3;
        ctx.strokeStyle = `rgba(6,182,212,${opacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cursorPos, H / 2, ripple, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
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
      recomputeLoopSeconds();
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
      missedNotes = msg.missedNotes as Record<string, boolean>;
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
    case 'RESET': {
      pausedScrollX = 0;
      pausedCursorPos = 0;
      missedNotes = {};
      break;
    }
    case 'STOP': {
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      break;
    }
  }
};
