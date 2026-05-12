import type { StrumPattern } from "feature/exercisePlan/types/exercise.types";

import { ARROW_AREA_H, CURSOR_COLOR, HEADER_H, LABEL_H, PAD, SLOT_W } from "./strumming.constants";

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

export function drawDownArrow(
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
    ctx.shadowBlur = 0; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - 8, cy - 8); ctx.lineTo(cx + 8, cy + 8);
    ctx.moveTo(cx + 8, cy - 8); ctx.lineTo(cx - 8, cy + 8); ctx.stroke();
  }
  ctx.restore();
}

export function drawUpArrow(
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
    ctx.shadowBlur = 0; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - 8, cy - 8); ctx.lineTo(cx + 8, cy + 8);
    ctx.moveTo(cx + 8, cy - 8); ctx.lineTo(cx - 8, cy + 8); ctx.stroke();
  }
  ctx.restore();
}

export function drawChordHeader(
  ctx: CanvasRenderingContext2D,
  W: number,
  pattern: StrumPattern,
  chordIdx: number,
) {
  const hasProgression = pattern.chords && pattern.chords.length > 0;
  if (hasProgression) {
    ctx.save();
    ctx.font = `bold 13px ui-sans-serif, system-ui, sans-serif`;
    let cx = PAD;
    const py = PAD + 5, ph = 24;
    pattern.chords!.forEach((ch, i) => {
      const isSelected = i === chordIdx;
      const tw = ctx.measureText(ch).width;
      const pw = tw + 16;
      ctx.fillStyle = isSelected ? "rgba(96,165,250,0.28)" : "rgba(96,165,250,0.07)";
      ctx.beginPath(); (ctx as any).roundRect(cx, py, pw, ph, 6); ctx.fill();
      ctx.strokeStyle = isSelected ? "rgba(96,165,250,0.75)" : "rgba(96,165,250,0.18)";
      ctx.lineWidth   = isSelected ? 1.5 : 1; ctx.stroke();
      ctx.fillStyle   = isSelected ? "#93c5fd" : "rgba(147,197,253,0.38)";
      ctx.textBaseline = "middle"; ctx.fillText(ch, cx + 8, py + ph / 2); ctx.textBaseline = "alphabetic";
      cx += pw + 6;
    });
    ctx.restore();
  } else if (pattern.chord) {
    ctx.save();
    ctx.font = `bold 28px ui-sans-serif, system-ui, sans-serif`;
    const textW = ctx.measureText(pattern.chord).width;
    const bx = PAD, by = PAD + 2, bw = textW + 20, bh = 32;
    ctx.fillStyle = "rgba(96,165,250,0.18)";
    ctx.beginPath(); (ctx as any).roundRect(bx, by, bw, bh, 8); ctx.fill();
    ctx.strokeStyle = "rgba(96,165,250,0.35)"; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = "#93c5fd"; ctx.textBaseline = "middle";
    ctx.fillText(pattern.chord, bx + 10, by + bh / 2); ctx.textBaseline = "alphabetic";
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
}

export function drawRepDots(
  ctx: CanvasRenderingContext2D,
  currentRep: number, maxReps: number, W: number, arrowTop: number,
) {
  const dotR       = 4;
  const dotStride  = 14;
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
