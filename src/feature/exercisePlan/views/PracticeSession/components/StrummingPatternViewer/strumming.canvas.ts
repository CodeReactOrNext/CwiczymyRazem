import type { StrumPattern } from "feature/exercisePlan/types/exercise.types";

import { ARROW_AREA_H, CURSOR_COLOR, LABEL_H, MIN_SLOT_W, PAD, SLOT_W } from "./strumming.constants";

export function makeLabels(beats: number, subdivisions: number): string[] {
  const subs4 = ["1","e","&","a","2","e","&","a","3","e","&","a","4","e","&","a","5","e","&","a","6","e","&","a"];
  const subs2 = ["1","&","2","&","3","&","4","&","5","&","6","&","7","&","8","&"];
  const src = subdivisions === 4 ? subs4 : subs2;
  const out: string[] = [];
  for (let b = 0; b < beats; b++)
    for (let s = 0; s < subdivisions; s++)
      out.push(src[b * subdivisions + s] ?? "");
  return out;
}

export function barPixelWidth(p: StrumPattern) {
  return p.timeSignature[0] * p.subdivisions * SLOT_W;
}

/** Widest the slots may be squeezed down to so a whole bar still fits the
 *  viewport — 16th patterns on a phone rely on this instead of being clipped. */
export function fitSlotWidth(viewW: number, totalSlots: number) {
  if (totalSlots <= 0) return MIN_SLOT_W;
  return Math.max(MIN_SLOT_W, (viewW - 2 * PAD) / totalSlots);
}

/** Canvas width: the viewport while the bar fits it, otherwise the bar's own
 *  width — the container scrolls rather than cutting the last strums off. */
export function canvasContentWidth(viewW: number, totalSlots: number) {
  const barW = 2 * PAD + totalSlots * fitSlotWidth(viewW, totalSlots);
  // A bar that fits keeps the canvas exactly viewport-wide (no stray scrollbar
  // from a rounding crumb); only a bar stuck at the floor grows the canvas.
  return barW <= viewW + 0.5 ? viewW : Math.ceil(barW);
}

/** Arrows are drawn for a comfortable ~34px slot. Narrower slots (16th patterns
 *  on a phone) shrink the glyph proportionally so heads never bleed into the
 *  neighbouring slot; wider slots keep the original size. */
export function slotScale(slotW: number) {
  return Math.min(1, Math.max(0.6, slotW / 34));
}

export function drawDownArrow(
  ctx: CanvasRenderingContext2D,
  cx: number, arrowTop: number, h: number,
  color: string, thick: boolean, muted: boolean,
  glowColor?: string, slotW: number = SLOT_W,
) {
  const s       = slotScale(slotW);
  const stemTop = arrowTop + h * 0.08;
  const stemBot = arrowTop + h * 0.72;
  const cy      = arrowTop + h / 2;
  const hw      = (thick ? 11 : 8) * s;
  const lw      = Math.max(1.5, (thick ? 3 : 2) * s);
  const xw      = 8 * s;
  ctx.save();
  if (glowColor) { ctx.shadowColor = glowColor; ctx.shadowBlur = 14; }
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(cx, stemTop); ctx.lineTo(cx, stemBot); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - hw, stemBot - hw * 1.0); ctx.lineTo(cx, stemBot + 3 * s); ctx.lineTo(cx + hw, stemBot - hw * 1.0);
  ctx.stroke();
  if (muted) {
    ctx.shadowBlur = 0; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - xw, cy - xw); ctx.lineTo(cx + xw, cy + xw);
    ctx.moveTo(cx + xw, cy - xw); ctx.lineTo(cx - xw, cy + xw); ctx.stroke();
  }
  ctx.restore();
}

export function drawUpArrow(
  ctx: CanvasRenderingContext2D,
  cx: number, arrowTop: number, h: number,
  color: string, thick: boolean, muted: boolean,
  glowColor?: string, slotW: number = SLOT_W,
) {
  const s       = slotScale(slotW);
  const cy      = arrowTop + h / 2;
  const stemBot = arrowTop + h * 0.92;
  const stemTop = arrowTop + h * 0.28;
  const hw      = (thick ? 11 : 8) * s;
  const lw      = Math.max(1.5, (thick ? 3 : 2) * s);
  const xw      = 8 * s;
  ctx.save();
  if (glowColor) { ctx.shadowColor = glowColor; ctx.shadowBlur = 14; }
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(cx, stemBot); ctx.lineTo(cx, stemTop); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - hw, stemTop + hw * 1.0); ctx.lineTo(cx, stemTop - 3 * s); ctx.lineTo(cx + hw, stemTop + hw * 1.0);
  ctx.stroke();
  if (muted) {
    ctx.shadowBlur = 0; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - xw, cy - xw); ctx.lineTo(cx + xw, cy + xw);
    ctx.moveTo(cx + xw, cy - xw); ctx.lineTo(cx - xw, cy + xw); ctx.stroke();
  }
  ctx.restore();
}

export function drawChordHeader(
  ctx: CanvasRenderingContext2D,
  W: number,
  pattern: StrumPattern,
  chordIdx: number,
  reservedRight: number = 0,
) {
  const hasProgression = pattern.chords && pattern.chords.length > 0;
  // Everything in the header has to live left of the "Rep n / m" counter.
  const headerRight = W - PAD - reservedRight;
  let contentRight  = PAD;

  if (hasProgression) {
    const chords = pattern.chords!;
    // Chips start at their comfortable size and step down once before giving up
    // and showing only the chord that is playing — a four-chord loop otherwise
    // runs off the right edge of a phone.
    const chipsWidth = (size: number, padX: number, gap: number) => {
      ctx.font = `bold ${size}px ui-sans-serif, system-ui, sans-serif`;
      return chords.reduce((w, ch) => w + ctx.measureText(ch).width + padX * 2 + gap, 0) - gap;
    };
    ctx.save();
    let size = 13, padX = 8, gap = 6;
    let width = chipsWidth(size, padX, gap);
    if (PAD + width > headerRight) {
      size = 11; padX = 5; gap = 4;
      width = chipsWidth(size, padX, gap);
    }
    const visible = PAD + width <= headerRight
      ? chords.map((ch, i) => [ch, i] as const)
      : [[`${chords[chordIdx]} · ${chordIdx + 1}/${chords.length}`, chordIdx] as const];
    ctx.font = `bold ${size}px ui-sans-serif, system-ui, sans-serif`;
    let cx = PAD;
    const py = PAD + 5, ph = 24;
    visible.forEach(([ch, i]) => {
      const isSelected = i === chordIdx;
      const pw = ctx.measureText(ch).width + padX * 2;
      ctx.fillStyle = isSelected ? "rgba(96,165,250,0.28)" : "rgba(96,165,250,0.07)";
      ctx.beginPath(); (ctx as any).roundRect(cx, py, pw, ph, 6); ctx.fill();
      ctx.strokeStyle = isSelected ? "rgba(96,165,250,0.75)" : "rgba(96,165,250,0.18)";
      ctx.lineWidth   = isSelected ? 1.5 : 1; ctx.stroke();
      ctx.fillStyle   = isSelected ? "#93c5fd" : "rgba(147,197,253,0.38)";
      ctx.textBaseline = "middle"; ctx.fillText(ch, cx + padX, py + ph / 2); ctx.textBaseline = "alphabetic";
      cx += pw + gap;
    });
    contentRight = cx - gap + 4;
    ctx.restore();
  } else if (pattern.chord) {
    ctx.save();
    const size  = W - PAD * 2 < 260 ? 22 : 28;
    ctx.font = `bold ${size}px ui-sans-serif, system-ui, sans-serif`;
    const textW = ctx.measureText(pattern.chord).width;
    const bx = PAD, by = PAD + 2, bw = textW + 20, bh = 32;
    ctx.fillStyle = "rgba(96,165,250,0.18)";
    ctx.beginPath(); (ctx as any).roundRect(bx, by, bw, bh, 8); ctx.fill();
    ctx.strokeStyle = "rgba(96,165,250,0.35)"; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = "#93c5fd"; ctx.textBaseline = "middle";
    ctx.fillText(pattern.chord, bx + 10, by + bh / 2); ctx.textBaseline = "alphabetic";
    contentRight = bx + bw + 10;
    ctx.restore();
  }

  if (pattern.name) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = `12px ui-sans-serif, system-ui, sans-serif`;
    const nameX = contentRight;
    // Dropped rather than clipped mid-word when the chords already took the row.
    if (nameX + ctx.measureText(pattern.name).width <= headerRight) {
      ctx.fillText(pattern.name, nameX, PAD + 20);
    }
    ctx.restore();
  }
}

export function drawRepDots(
  ctx: CanvasRenderingContext2D,
  currentRep: number, maxReps: number, W: number, arrowTop: number,
) {
  const dotR       = 4;
  // Long sets would otherwise run the row off both edges on a narrow canvas.
  const dotStride  = Math.min(14, (W - 2 * PAD - dotR * 2) / Math.max(1, maxReps - 1));
  const dotsW      = (maxReps - 1) * dotStride + dotR * 2;
  const dotsStartX = Math.max(PAD, (W - dotsW) / 2);
  const dotsY      = arrowTop + ARROW_AREA_H + LABEL_H + 3;
  for (let i = 0; i < maxReps; i++) {
    const cx = dotsStartX + i * dotStride + dotR;
    const cy = dotsY + dotR;
    ctx.beginPath(); ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
    if (i < currentRep) {
      ctx.fillStyle = "rgba(96,165,250,0.55)"; ctx.fill();
    } else if (i === currentRep) {
      ctx.fillStyle = "rgba(250,204,21,0.85)"; ctx.fill();
    } else {
      ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 1; ctx.stroke();
    }
  }
}

export function drawCursor(
  ctx: CanvasRenderingContext2D,
  cursorScreenX: number, arrowTop: number, idleCursor: boolean,
) {
  if (cursorScreenX < PAD - 2) return;
  ctx.save();
  if (idleCursor) {
    ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(cursorScreenX, arrowTop - 2); ctx.lineTo(cursorScreenX, arrowTop + ARROW_AREA_H + 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,255,255,0.30)"; ctx.font = `bold 10px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.fillText("▶ PLAY", cursorScreenX + 20, arrowTop - 8); ctx.textAlign = "left";
  } else {
    ctx.strokeStyle = CURSOR_COLOR; ctx.lineWidth = 2;
    ctx.shadowColor = CURSOR_COLOR; ctx.shadowBlur  = 12;
    ctx.beginPath(); ctx.moveTo(cursorScreenX, arrowTop - 2); ctx.lineTo(cursorScreenX, arrowTop + ARROW_AREA_H + 2); ctx.stroke();
  }
  ctx.restore();
}
