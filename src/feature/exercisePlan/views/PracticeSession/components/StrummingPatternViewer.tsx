import { useEffect, useRef, useCallback, memo } from "react";
import { cn } from "assets/lib/utils";
import type { StrumPattern, StrumBeat } from "feature/exercisePlan/types/exercise.types";
import type { SlotResult } from "../hooks/useStrummingMatcher";

// ─── Layout constants ─────────────────────────────────────────────────────────

const SLOT_W       = 64;  // used only for timing calculations (must match useStrummingMatcher)
const ARROW_AREA_H = 88;
const LABEL_H      = 26;
const HEADER_H     = 36;
const PAD          = 16;
const DOTS_H       = 22;  // height reserved for rep-progress dots

const CURSOR_COLOR = "rgba(250,204,21,0.90)";
const BG_COLOR     = "#0a0a0a";
const DOWN_COLOR   = "#60a5fa";
const UP_COLOR     = "#c084fc";
const MUTED_COLOR  = "#fb923c";
const MISS_COLOR   = "rgba(255,255,255,0.10)";
const ACCENT_DOT   = "#facc15";
const LABEL_BEAT   = "rgba(255,255,255,0.75)";
const LABEL_SUB    = "rgba(255,255,255,0.28)";
const BEAT_LINE    = "rgba(255,255,255,0.06)";
const BAR_LINE     = "rgba(255,255,255,0.18)";

// ─── Sound synthesis ──────────────────────────────────────────────────────────

const CHORD_FREQS: Record<string, number[]> = {
  default: [82.41, 110.0, 146.83, 196.0, 246.94, 329.63],
  Em:  [82.41, 123.47, 164.81, 196.0, 246.94, 329.63],
  Am:  [110.0, 146.83, 220.0, 261.63, 329.63, 440.0],
  G:   [98.0,  146.83, 196.0, 246.94, 293.66, 392.0],
  C:   [130.81, 164.81, 261.63, 329.63, 392.0, 523.25],
  D:   [146.83, 220.0, 293.66, 369.99, 440.0, 587.33],
  E:   [82.41,  123.47, 164.81, 207.65, 246.94, 329.63],
  A:   [110.0,  146.83, 220.0, 277.18, 329.63, 440.0],
  F:   [87.31,  130.81, 174.61, 261.63, 349.23, 523.25],
  "E5": [82.41, 123.47, 164.81, 246.94, 0, 0],
  "A5": [110.0, 146.83, 220.0, 329.63, 0, 0],
  "G5": [98.0,  146.83, 196.0, 293.66, 0, 0],
  "E9": [82.41, 123.47, 164.81, 207.65, 277.18, 329.63],
  Am7: [110.0, 146.83, 196.0, 261.63, 329.63, 440.0],
};

function ksString(ctx: AudioContext, freq: number, t: number, decay: number, vol: number, dest: AudioNode) {
  const sr        = ctx.sampleRate;
  const periodLen = Math.max(2, Math.round(sr / freq));
  const buf       = ctx.createBuffer(1, periodLen, sr);
  const data      = buf.getChannelData(0);
  for (let i = 0; i < periodLen; i++) data[i] = Math.random() * 2 - 1;
  for (let pass = 0; pass < 3; pass++)
    for (let i = 1; i < periodLen; i++)
      data[i] = (data[i] + data[i - 1]) * 0.5;

  const src  = ctx.createBufferSource();
  src.buffer = buf;
  src.loop   = true;

  const lpf           = ctx.createBiquadFilter();
  lpf.type            = "lowpass";
  lpf.frequency.value = Math.min(freq * 6, 6000);
  lpf.Q.value         = 0.4;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);

  src.connect(lpf); lpf.connect(gain); gain.connect(dest);
  src.start(t); src.stop(t + decay + 0.05);
}

function playStrumSound(ctx: AudioContext, direction: "down" | "up", muted: boolean, accented: boolean, chord?: string) {
  const now   = ctx.currentTime;
  const vol   = accented ? 0.55 : muted ? 0.3 : 0.42;
  const decay = muted ? 0.06 : direction === "up" ? 0.55 : 0.75;

  const rawFreqs: number[] = (chord ? CHORD_FREQS[chord] : undefined) ?? CHORD_FREQS.default ?? [];
  const allFreqs = rawFreqs.filter((f: number) => f > 0);
  const freqs    = direction === "down" ? allFreqs : [...allFreqs].reverse();

  const master = ctx.createGain();
  master.gain.value = 1;
  master.connect(ctx.destination);

  const bodyEq           = ctx.createBiquadFilter();
  bodyEq.type            = "peaking";
  bodyEq.frequency.value = 320;
  bodyEq.gain.value      = 4;
  bodyEq.Q.value         = 0.8;
  bodyEq.connect(master);

  const hpf           = ctx.createBiquadFilter();
  hpf.type            = "highpass";
  hpf.frequency.value = 90;
  hpf.connect(bodyEq);

  const presence           = ctx.createBiquadFilter();
  presence.type            = "lowpass";
  presence.frequency.value = 5000;
  presence.connect(hpf);

  const wet          = ctx.createGain();
  wet.gain.value     = 0.18;
  wet.connect(master);
  const delay1       = ctx.createDelay(0.5);
  delay1.delayTime.value = 0.027;
  const delay2       = ctx.createDelay(0.5);
  delay2.delayTime.value = 0.043;
  const revLpf       = ctx.createBiquadFilter();
  revLpf.type        = "lowpass";
  revLpf.frequency.value = 2000;
  const revGain      = ctx.createGain();
  revGain.gain.value = 0.35;
  presence.connect(delay1);
  delay1.connect(revLpf); revLpf.connect(delay2);
  delay2.connect(revGain); revGain.connect(delay1); revGain.connect(wet);

  const stagger = 0.006;
  const strVol  = vol / freqs.length;
  freqs.forEach((freq: number, i: number) => {
    ksString(ctx, freq, now + i * stagger, decay, strVol, presence);
  });
}

// ─── Beat label helpers ───────────────────────────────────────────────────────

function makeLabels(beats: number, subdivisions: number): string[] {
  const subs4 = ["1","e","&","a","2","e","&","a","3","e","&","a","4","e","&","a","5","e","&","a","6","e","&","a"];
  const subs2 = ["1","&","2","&","3","&","4","&","5","&","6","&","7","&","8","&"];
  const src = subdivisions === 4 ? subs4 : subs2;
  const out: string[] = [];
  for (let b = 0; b < beats; b++)
    for (let s = 0; s < subdivisions; s++)
      out.push(src[b * subdivisions + s] ?? "");
  return out;
}

function barPixelWidth(p: StrumPattern) {
  return p.timeSignature[0] * p.subdivisions * SLOT_W;
}

// ─── Arrow drawing ────────────────────────────────────────────────────────────

function drawDownArrow(
  ctx: CanvasRenderingContext2D,
  cx: number, arrowTop: number, h: number,
  color: string, thick: boolean, muted: boolean,
  glowColor?: string,
) {
  const stemTop = arrowTop + h * 0.08;
  const stemBot = arrowTop + h * 0.72;
  const cy      = arrowTop + h / 2;
  const hw      = thick ? 11 : 8;
  const lw      = thick ? 3 : 2;
  ctx.save();
  if (glowColor) { ctx.shadowColor = glowColor; ctx.shadowBlur = 14; }
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(cx, stemTop); ctx.lineTo(cx, stemBot); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - hw, stemBot - hw * 1.0); ctx.lineTo(cx, stemBot + 3); ctx.lineTo(cx + hw, stemBot - hw * 1.0);
  ctx.stroke();
  if (muted) {
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - 8, cy - 8); ctx.lineTo(cx + 8, cy + 8);
    ctx.moveTo(cx + 8, cy - 8); ctx.lineTo(cx - 8, cy + 8); ctx.stroke();
  }
  ctx.restore();
}

function drawUpArrow(
  ctx: CanvasRenderingContext2D,
  cx: number, arrowTop: number, h: number,
  color: string, thick: boolean, muted: boolean,
  glowColor?: string,
) {
  const cy      = arrowTop + h / 2;
  const stemBot = arrowTop + h * 0.92;
  const stemTop = arrowTop + h * 0.28;
  const hw      = thick ? 11 : 8;
  const lw      = thick ? 3 : 2;
  ctx.save();
  if (glowColor) { ctx.shadowColor = glowColor; ctx.shadowBlur = 14; }
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(cx, stemBot); ctx.lineTo(cx, stemTop); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - hw, stemTop + hw * 1.0); ctx.lineTo(cx, stemTop - 3); ctx.lineTo(cx + hw, stemTop + hw * 1.0);
  ctx.stroke();
  if (muted) {
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - 8, cy - 8); ctx.lineTo(cx + 8, cy + 8);
    ctx.moveTo(cx + 8, cy - 8); ctx.lineTo(cx - 8, cy + 8); ctx.stroke();
  }
  ctx.restore();
}

// ─── Canvas draw ──────────────────────────────────────────────────────────────

function drawFrame(
  ctx: CanvasRenderingContext2D,
  dpr: number,
  canvasW: number,
  canvasH: number,
  pattern: StrumPattern,
  cursorScreenX: number,   // pixel position of cursor; -1 when hidden
  chordIdx: number,
  slotFeedback: Map<number, SlotResult>,
  prevSlotFeedback: Map<number, SlotResult>,
  transitionAlpha: number, // 0..1 — alpha for prevSlotFeedback overlay
  micEnabled: boolean,
  idleCursor: boolean,
  currentRep: number,      // 0-indexed within set (0..maxReps-1)
  maxReps: number,
  drawSlotW: number,       // scaled slot width to fit canvas
) {
  ctx.save();
  ctx.scale(dpr, dpr);
  const W = canvasW / dpr;
  const H = canvasH / dpr;

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, W, H);

  const totalSlots   = pattern.timeSignature[0] * pattern.subdivisions;
  const labels       = makeLabels(pattern.timeSignature[0], pattern.subdivisions);
  const arrowTop     = PAD + HEADER_H;
  const patternLeft  = PAD;
  const patternWidth = totalSlots * drawSlotW;
  const isActive     = cursorScreenX >= 0 && !idleCursor;

  // ── Chord display (fixed, non-scrolling) ─────────────────────────────────
  const hasProgression = pattern.chords && pattern.chords.length > 0;
  if (hasProgression) {
    ctx.save();
    ctx.font = `bold 13px ui-sans-serif, system-ui, sans-serif`;
    let cx = PAD;
    const py = PAD + 5;
    const ph = 24;
    pattern.chords!.forEach((ch, i) => {
      const isSelected = i === chordIdx;
      const tw = ctx.measureText(ch).width;
      const pw = tw + 16;
      ctx.fillStyle = isSelected ? "rgba(96,165,250,0.28)" : "rgba(96,165,250,0.07)";
      ctx.beginPath();
      (ctx as any).roundRect(cx, py, pw, ph, 6);
      ctx.fill();
      ctx.strokeStyle = isSelected ? "rgba(96,165,250,0.75)" : "rgba(96,165,250,0.18)";
      ctx.lineWidth   = isSelected ? 1.5 : 1;
      ctx.stroke();
      ctx.fillStyle   = isSelected ? "#93c5fd" : "rgba(147,197,253,0.38)";
      ctx.textBaseline = "middle";
      ctx.fillText(ch, cx + 8, py + ph / 2);
      ctx.textBaseline = "alphabetic";
      cx += pw + 6;
    });
    ctx.restore();
  } else if (pattern.chord) {
    ctx.save();
    ctx.font = `bold 28px ui-sans-serif, system-ui, sans-serif`;
    const textW = ctx.measureText(pattern.chord).width;
    const bx = PAD, by = PAD + 2, bw = textW + 20, bh = 32;
    ctx.fillStyle = "rgba(96,165,250,0.18)";
    ctx.beginPath();
    (ctx as any).roundRect(bx, by, bw, bh, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(96,165,250,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#93c5fd";
    ctx.textBaseline = "middle";
    ctx.fillText(pattern.chord, bx + 10, by + bh / 2);
    ctx.textBaseline = "alphabetic";
    ctx.restore();
  }

  if (pattern.name) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = `12px ui-sans-serif, system-ui, sans-serif`;
    let nameX = PAD;
    if (hasProgression && pattern.chords) {
      ctx.font = `bold 13px ui-sans-serif, system-ui, sans-serif`;
      let pw = 0;
      pattern.chords.forEach(ch => { pw += ctx.measureText(ch).width + 16 + 6; });
      nameX = PAD + pw + 4;
      ctx.font = `12px ui-sans-serif, system-ui, sans-serif`;
    } else if (pattern.chord) {
      ctx.font = `bold 28px ui-sans-serif, system-ui, sans-serif`;
      const cw = ctx.measureText(pattern.chord).width + 20 + PAD + 10;
      ctx.font = `12px ui-sans-serif, system-ui, sans-serif`;
      nameX = cw + PAD;
    }
    ctx.fillText(pattern.name, nameX, PAD + 20);
    ctx.restore();
  }

  // ── Rep counter (top-right) ───────────────────────────────────────────────
  ctx.save();
  ctx.font      = `bold 12px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.38)";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(`Rep ${currentRep + 1} / ${maxReps}`, W - PAD, PAD + HEADER_H / 2);
  ctx.textAlign    = "left";
  ctx.textBaseline = "alphabetic";
  ctx.restore();

  // ── Left and right bar-line borders ──────────────────────────────────────
  ctx.strokeStyle = BAR_LINE;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(patternLeft, arrowTop);
  ctx.lineTo(patternLeft, arrowTop + ARROW_AREA_H);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(patternLeft + patternWidth, arrowTop);
  ctx.lineTo(patternLeft + patternWidth, arrowTop + ARROW_AREA_H);
  ctx.stroke();

  // ── Slots ─────────────────────────────────────────────────────────────────
  for (let si = 0; si < totalSlots; si++) {
    const slotLeft = patternLeft + si * drawSlotW;
    const slotCX   = slotLeft + drawSlotW / 2;

    if (si > 0) {
      ctx.strokeStyle = si % pattern.subdivisions === 0 ? BAR_LINE : BEAT_LINE;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(slotLeft, arrowTop + 4);
      ctx.lineTo(slotLeft, arrowTop + ARROW_AREA_H - 4);
      ctx.stroke();
    }

    const beat: StrumBeat = pattern.strums[si]!;
    if (!beat) continue;

    // ── Previous-rep feedback overlay (fading out) ─────────────────────────
    if (micEnabled && transitionAlpha > 0) {
      const prevFb = prevSlotFeedback.get(si);
      if (prevFb) {
        ctx.save();
        ctx.globalAlpha = transitionAlpha;
        ctx.fillStyle =
          prevFb === "hit"   ? "rgba(74,222,128,0.22)" :
          prevFb === "wrong" ? "rgba(234,88,12,0.26)"  :
                               "rgba(239,68,68,0.14)";
        ctx.beginPath();
        (ctx as any).roundRect(slotLeft + 2, arrowTop + 2, drawSlotW - 4, ARROW_AREA_H - 4, 6);
        ctx.fill();
        ctx.restore();
      }
    }

    // ── Current-rep feedback overlay ───────────────────────────────────────
    const feedback = micEnabled ? slotFeedback.get(si) : undefined;
    if (feedback === "hit") {
      ctx.save();
      ctx.fillStyle = "rgba(74,222,128,0.18)";
      ctx.beginPath();
      (ctx as any).roundRect(slotLeft + 2, arrowTop + 2, drawSlotW - 4, ARROW_AREA_H - 4, 6);
      ctx.fill();
      ctx.restore();
    } else if (feedback === "wrong") {
      ctx.save();
      ctx.fillStyle = "rgba(234,88,12,0.22)";
      ctx.beginPath();
      (ctx as any).roundRect(slotLeft + 2, arrowTop + 2, drawSlotW - 4, ARROW_AREA_H - 4, 6);
      ctx.fill();
      ctx.restore();
    } else if (feedback === "miss") {
      ctx.save();
      ctx.fillStyle = "rgba(239,68,68,0.12)";
      ctx.beginPath();
      (ctx as any).roundRect(slotLeft + 2, arrowTop + 2, drawSlotW - 4, ARROW_AREA_H - 4, 6);
      ctx.fill();
      ctx.restore();
    }

    const isSlotActive = isActive &&
      slotCX >= cursorScreenX - drawSlotW / 2 &&
      slotCX <  cursorScreenX + drawSlotW / 2;

    const dimmed = feedback === "miss";

    const baseColor =
      dimmed                    ? "rgba(255,255,255,0.12)" :
      beat.muted                ? MUTED_COLOR :
      beat.direction === "down" ? DOWN_COLOR  :
      beat.direction === "up"   ? UP_COLOR    :
                                  MISS_COLOR;

    const activeColor =
      beat.muted               ? "#fde68a" :
      beat.direction === "down" ? "#bfdbfe" :
      beat.direction === "up"   ? "#e9d5ff" :
                                  MISS_COLOR;

    const color     = (isSlotActive && beat.direction !== "miss") ? activeColor : baseColor;
    const thick     = isSlotActive && beat.direction !== "miss";
    const glowColor = feedback === "hit" ? "rgba(74,222,128,0.9)" : undefined;

    if (isSlotActive && beat.direction !== "miss") {
      ctx.save();
      ctx.fillStyle = beat.direction === "down"
        ? "rgba(96,165,250,0.13)"
        : "rgba(192,132,252,0.13)";
      ctx.beginPath();
      (ctx as any).roundRect(slotLeft + 2, arrowTop + 2, drawSlotW - 4, ARROW_AREA_H - 4, 6);
      ctx.fill();
      ctx.restore();
    }

    if (beat.direction === "down") {
      drawDownArrow(ctx, slotCX, arrowTop, ARROW_AREA_H, color, thick, !!beat.muted, glowColor);
    } else if (beat.direction === "up") {
      drawUpArrow(ctx, slotCX, arrowTop, ARROW_AREA_H, color, thick, !!beat.muted, glowColor);
    } else {
      ctx.fillStyle = MISS_COLOR;
      ctx.beginPath();
      ctx.arc(slotCX, arrowTop + ARROW_AREA_H / 2, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (beat.accented && beat.direction !== "miss") {
      ctx.fillStyle = ACCENT_DOT;
      ctx.beginPath();
      ctx.arc(slotLeft + drawSlotW - 10, arrowTop + 10, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const label  = labels[si] ?? "";
    const isBeat = si % pattern.subdivisions === 0;
    ctx.fillStyle = isBeat ? LABEL_BEAT : LABEL_SUB;
    ctx.font      = isBeat
      ? `bold 12px ui-sans-serif, system-ui, sans-serif`
      : `11px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(label, slotCX, arrowTop + ARROW_AREA_H + LABEL_H - 6);
    ctx.textAlign = "left";
  }

  // ── Progress dots (rep tracker) ───────────────────────────────────────────
  const dotR      = 4;
  const dotStride = 14;  // center-to-center spacing
  const dotsW     = (maxReps - 1) * dotStride + dotR * 2;
  const dotsStartX = Math.max(PAD, (W - dotsW) / 2);
  const dotsY     = arrowTop + ARROW_AREA_H + LABEL_H + 3;

  for (let i = 0; i < maxReps; i++) {
    const cx = dotsStartX + i * dotStride + dotR;
    const cy = dotsY + dotR;
    ctx.beginPath();
    ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
    if (i < currentRep) {
      ctx.fillStyle = "rgba(96,165,250,0.55)";
      ctx.fill();
    } else if (i === currentRep) {
      ctx.fillStyle = "rgba(250,204,21,0.85)";
      ctx.fill();
    } else {
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth   = 1;
      ctx.stroke();
    }
  }

  // ── Cursor ───────────────────────────────────────────────────────────────
  if (cursorScreenX >= PAD - 2) {
    ctx.save();
    if (idleCursor) {
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cursorScreenX, arrowTop - 2);
      ctx.lineTo(cursorScreenX, arrowTop + ARROW_AREA_H + 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,255,255,0.30)";
      ctx.font      = `bold 10px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("▶ PLAY", cursorScreenX + 20, arrowTop - 8);
      ctx.textAlign = "left";
    } else {
      ctx.strokeStyle = CURSOR_COLOR;
      ctx.lineWidth   = 2;
      ctx.shadowColor = CURSOR_COLOR;
      ctx.shadowBlur  = 12;
      ctx.beginPath();
      ctx.moveTo(cursorScreenX, arrowTop - 2);
      ctx.lineTo(cursorScreenX, arrowTop + ARROW_AREA_H + 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}

// ─── Component ────────────────────────────────────────────────────────────────

interface StrummingPatternViewerProps {
  patterns: StrumPattern[];
  bpm: number;
  isPlaying: boolean;
  startTime: number | null;
  countInRemaining?: number;
  className?: string;
  /** Slot feedback map from useStrummingMatcher — renders hit/miss/wrong colors */
  slotFeedback?: Map<number, SlotResult>;
  /** Whether mic is enabled (controls whether overlays are painted) */
  isMicEnabled?: boolean;
  /** Number of reps per set before cycling (default 10) */
  maxReps?: number;
}

function StrummingPatternViewerInner({
  patterns,
  bpm,
  isPlaying,
  startTime,
  countInRemaining = 0,
  className,
  slotFeedback,
  isMicEnabled,
  maxReps = 10,
}: StrummingPatternViewerProps) {
  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const containerRef     = useRef<HTMLDivElement>(null);
  const rafRef           = useRef<number | null>(null);
  const sizeRef          = useRef({ w: 0, h: 0 });
  const audioCtxRef      = useRef<AudioContext | null>(null);
  const lastSlotRef      = useRef<number>(-1);
  const lastStartTimeRef = useRef<number | null>(null);

  // ── Transition (prev-rep fade) refs ─────────────────────────────────────
  const prevFeedbackRef      = useRef<Map<number, SlotResult>>(new Map());
  const transitionStartRef   = useRef<number | null>(null);
  const viewerLoopCountRef   = useRef<number>(0);

  const pattern = patterns[0];
  const canvasH = PAD + HEADER_H + ARROW_AREA_H + LABEL_H + DOTS_H + PAD;

  // Reset on stop
  useEffect(() => {
    if (!isPlaying) {
      lastSlotRef.current        = -1;
      viewerLoopCountRef.current = 0;
      prevFeedbackRef.current    = new Map();
      transitionStartRef.current = null;
    }
  }, [isPlaying]);

  // ── AudioContext ─────────────────────────────────────────────────────────
  function getAudioCtx() {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  }

  // ── Resize observer ──────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      sizeRef.current = { w, h: canvasH };
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr     = window.devicePixelRatio || 1;
      canvas.width  = w * dpr;
      canvas.height = canvasH * dpr;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvasH]);

  // ── Animation loop ───────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) { rafRef.current = requestAnimationFrame(tick); return; }
    const ctx = canvas.getContext("2d");
    if (!ctx)   { rafRef.current = requestAnimationFrame(tick); return; }

    const { w } = sizeRef.current;
    if (!pattern || w === 0) { rafRef.current = requestAnimationFrame(tick); return; }

    const dpr        = window.devicePixelRatio || 1;
    const totalSlots = pattern.timeSignature[0] * pattern.subdivisions;
    const bpw        = barPixelWidth(pattern);

    // Dynamic slot width — scale to fit the canvas width
    const drawSlotW  = Math.max(28, (w - 2 * PAD) / totalSlots);
    const drawBpw    = totalSlots * drawSlotW;

    let cursorScreenX  = -1;
    let totalPixels    = 0;
    let chordIdx       = 0;
    let currentRep     = 0;

    const active = isPlaying && startTime !== null && countInRemaining === 0;

    if (active) {
      // Reset on playback restart
      if (startTime !== lastStartTimeRef.current) {
        lastStartTimeRef.current   = startTime;
        lastSlotRef.current        = -1;
        viewerLoopCountRef.current = 0;
        prevFeedbackRef.current    = new Map();
        transitionStartRef.current = null;
      }

      // ── Wall-clock based position ─────────────────────────────────────
      const elapsedMs  = Date.now() - startTime;
      const elapsedSec = Math.max(0, elapsedMs / 1000);
      const bps        = bpm / 60;
      const barDurSec  = pattern.timeSignature[0] / bps;
      totalPixels = (elapsedSec / barDurSec) * bpw;

      // Current bar → chord index and rep counter
      const barsDone  = Math.floor(totalPixels / bpw);
      const chordList = pattern.chords && pattern.chords.length > 0 ? pattern.chords : null;
      chordIdx        = chordList ? barsDone % chordList.length : 0;
      currentRep      = barsDone % maxReps;
      const currentChord = chordList ? chordList[chordIdx] : pattern.chord;

      // ── Detect loop restart → capture snapshot for fade transition ───
      if (barsDone > viewerLoopCountRef.current) {
        viewerLoopCountRef.current = barsDone;
        prevFeedbackRef.current    = new Map(slotFeedback ?? new Map());
        transitionStartRef.current = performance.now();
      }

      // ── Cursor: sweep left→right across the pattern ─────────────────
      const repProgress = (totalPixels % bpw) / bpw;   // 0..1 within current rep
      cursorScreenX = PAD + repProgress * drawBpw;

      // ── Sound trigger ──────────────────────────────────────────────────
      const totalSlotsElapsed = Math.floor(totalPixels / SLOT_W);
      if (totalSlotsElapsed !== lastSlotRef.current) {
        lastSlotRef.current = totalSlotsElapsed;
        const slotInBar = totalSlotsElapsed % totalSlots;
        const beat      = pattern.strums[slotInBar];
        if (beat && beat.direction !== "miss") {
          try {
            playStrumSound(getAudioCtx(), beat.direction, !!beat.muted, !!beat.accented, currentChord);
          } catch (_) { /* ignore AudioContext errors */ }
        }
      }
    }

    // ── Transition alpha for previous-rep overlay ─────────────────────────
    const transitionAlpha = (transitionStartRef.current !== null)
      ? Math.max(0, 1 - (performance.now() - transitionStartRef.current) / 400)
      : 0;

    // When stopped, park the cursor at the start so the user sees where to begin
    const idleCursor = !active && countInRemaining === 0;
    if (idleCursor) {
      cursorScreenX = PAD;  // left edge of pattern
    }

    drawFrame(
      ctx, dpr, canvas.width, canvas.height, pattern,
      cursorScreenX, chordIdx,
      slotFeedback ?? new Map(),
      prevFeedbackRef.current,
      transitionAlpha,
      !!(isMicEnabled && active),
      idleCursor,
      currentRep,
      maxReps,
      drawSlotW,
    );
    rafRef.current = requestAnimationFrame(tick);
  }, [pattern, bpm, isPlaying, startTime, countInRemaining, slotFeedback, isMicEnabled, maxReps]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [tick]);

  useEffect(() => () => { audioCtxRef.current?.close(); }, []);

  if (!pattern) return null;

  const hasChords = pattern.chords && pattern.chords.length > 1;

  return (
    <div className={cn("relative w-full bg-[#0a0a0a] rounded-xl overflow-hidden", className)}>
      {/* Canvas */}
      <div ref={containerRef} style={{ width: "100%", height: canvasH }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>

      {/* Count-in overlay */}
      {countInRemaining > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-20 animate-in fade-in duration-300">
          <div className="flex flex-col items-center">
            <span className="text-8xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] animate-bounce">
              {countInRemaining}
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/50 mt-4">
              Get Ready
            </span>
          </div>
        </div>
      )}

      {/* Legend + controls */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 border-t border-white/5 text-xs text-zinc-400">
        {/* Arrow legend */}
        <span className="flex items-center gap-1">
          <svg width={9} height={14} viewBox="0 0 9 14">
            <line x1={4.5} y1={1} x2={4.5} y2={9} stroke={DOWN_COLOR} strokeWidth={2} strokeLinecap="round"/>
            <polyline points="1,6 4.5,12 8,6" fill="none" stroke={DOWN_COLOR} strokeWidth={2} strokeLinejoin="round"/>
          </svg>
          Down
        </span>
        <span className="flex items-center gap-1">
          <svg width={9} height={14} viewBox="0 0 9 14">
            <line x1={4.5} y1={13} x2={4.5} y2={5} stroke={UP_COLOR} strokeWidth={2} strokeLinecap="round"/>
            <polyline points="1,8 4.5,2 8,8" fill="none" stroke={UP_COLOR} strokeWidth={2} strokeLinejoin="round"/>
          </svg>
          Up
        </span>
        <span className="flex items-center gap-1">
          <span style={{ color: MUTED_COLOR, fontWeight: 700, fontSize: 11 }}>✕</span>
          Muted
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: ACCENT_DOT }}/>
          Accent
        </span>

        {/* Spacer */}
        <span className="flex-1" />

        {/* Chord progression indicator label */}
        {hasChords && (
          <span className="text-zinc-500">
            {pattern.chords!.length} chords / loop
          </span>
        )}
      </div>
    </div>
  );
}

export const StrummingPatternViewer = memo(StrummingPatternViewerInner, (prev, next) =>
  Object.is(prev.patterns,       next.patterns)     &&
  prev.bpm              === next.bpm                &&
  prev.isPlaying        === next.isPlaying           &&
  prev.startTime        === next.startTime           &&
  prev.countInRemaining === next.countInRemaining    &&
  prev.className        === next.className           &&
  prev.isMicEnabled     === next.isMicEnabled        &&
  prev.maxReps          === next.maxReps             &&
  Object.is(prev.slotFeedback, next.slotFeedback)
);
