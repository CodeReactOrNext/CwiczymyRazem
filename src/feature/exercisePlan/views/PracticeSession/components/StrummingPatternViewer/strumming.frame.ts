import type { StrumBeat, StrumPattern } from "feature/exercisePlan/types/exercise.types";

import type { SlotResult } from "../../hooks/useStrummingMatcher";
import {
  ACCENT_DOT, ARROW_AREA_H, BAR_LINE, BEAT_LINE, BG_COLOR,
  DOWN_COLOR, HEADER_H, LABEL_BEAT, LABEL_H, LABEL_SUB,
  MISS_COLOR, MUTED_COLOR, PAD, UP_COLOR,
} from "./strumming.constants";
import { drawChordHeader, drawCursor, drawDownArrow, drawRepDots, drawUpArrow, makeLabels } from "./strumming.canvas";

function drawSlots(
  ctx: CanvasRenderingContext2D, pattern: StrumPattern,
  totalSlots: number, labels: string[], arrowTop: number,
  drawSlotW: number, cursorScreenX: number, isActive: boolean,
  micEnabled: boolean, slotFeedback: Map<number, SlotResult>,
  prevSlotFeedback: Map<number, SlotResult>, transitionAlpha: number,
) {
  const patternLeft = PAD;
  for (let si = 0; si < totalSlots; si++) {
    const slotLeft = patternLeft + si * drawSlotW;
    const slotCX   = slotLeft + drawSlotW / 2;

    if (si > 0) {
      ctx.strokeStyle = si % pattern.subdivisions === 0 ? BAR_LINE : BEAT_LINE;
      ctx.lineWidth   = 1;
      ctx.beginPath(); ctx.moveTo(slotLeft, arrowTop + 4); ctx.lineTo(slotLeft, arrowTop + ARROW_AREA_H - 4); ctx.stroke();
    }

    const beat: StrumBeat = pattern.strums[si]!;
    if (!beat) continue;

    if (micEnabled && transitionAlpha > 0) {
      const prevFb = prevSlotFeedback.get(si);
      if (prevFb) {
        ctx.save(); ctx.globalAlpha = transitionAlpha;
        ctx.fillStyle =
          prevFb === "hit"   ? "rgba(74,222,128,0.22)" :
          prevFb === "wrong" ? "rgba(234,88,12,0.26)"  : "rgba(239,68,68,0.14)";
        ctx.beginPath(); (ctx as any).roundRect(slotLeft + 2, arrowTop + 2, drawSlotW - 4, ARROW_AREA_H - 4, 6); ctx.fill();
        ctx.restore();
      }
    }

    const feedback = micEnabled ? slotFeedback.get(si) : undefined;
    if (feedback === "hit") {
      ctx.save(); ctx.fillStyle = "rgba(74,222,128,0.18)";
      ctx.beginPath(); (ctx as any).roundRect(slotLeft + 2, arrowTop + 2, drawSlotW - 4, ARROW_AREA_H - 4, 6); ctx.fill(); ctx.restore();
    } else if (feedback === "wrong") {
      ctx.save(); ctx.fillStyle = "rgba(234,88,12,0.22)";
      ctx.beginPath(); (ctx as any).roundRect(slotLeft + 2, arrowTop + 2, drawSlotW - 4, ARROW_AREA_H - 4, 6); ctx.fill(); ctx.restore();
    } else if (feedback === "miss") {
      ctx.save(); ctx.fillStyle = "rgba(239,68,68,0.12)";
      ctx.beginPath(); (ctx as any).roundRect(slotLeft + 2, arrowTop + 2, drawSlotW - 4, ARROW_AREA_H - 4, 6); ctx.fill(); ctx.restore();
    }

    const isSlotActive = isActive && slotCX >= cursorScreenX - drawSlotW / 2 && slotCX < cursorScreenX + drawSlotW / 2;
    const dimmed       = feedback === "miss";

    const baseColor =
      dimmed                    ? "rgba(255,255,255,0.12)" :
      beat.muted                ? MUTED_COLOR :
      beat.direction === "down" ? DOWN_COLOR  :
      beat.direction === "up"   ? UP_COLOR    : MISS_COLOR;

    const activeColor =
      beat.muted                ? "#fde68a" :
      beat.direction === "down" ? "#bfdbfe" :
      beat.direction === "up"   ? "#e9d5ff" : MISS_COLOR;

    const color     = (isSlotActive && beat.direction !== "miss") ? activeColor : baseColor;
    const thick     = isSlotActive && beat.direction !== "miss";
    const glowColor = feedback === "hit" ? "rgba(74,222,128,0.9)" : undefined;

    if (isSlotActive && beat.direction !== "miss") {
      ctx.save();
      ctx.fillStyle = beat.direction === "down" ? "rgba(96,165,250,0.13)" : "rgba(192,132,252,0.13)";
      ctx.beginPath(); (ctx as any).roundRect(slotLeft + 2, arrowTop + 2, drawSlotW - 4, ARROW_AREA_H - 4, 6); ctx.fill();
      ctx.restore();
    }

    if (beat.direction === "down") {
      drawDownArrow(ctx, slotCX, arrowTop, ARROW_AREA_H, color, thick, !!beat.muted, glowColor);
    } else if (beat.direction === "up") {
      drawUpArrow(ctx, slotCX, arrowTop, ARROW_AREA_H, color, thick, !!beat.muted, glowColor);
    } else {
      ctx.fillStyle = MISS_COLOR; ctx.beginPath(); ctx.arc(slotCX, arrowTop + ARROW_AREA_H / 2, 3.5, 0, Math.PI * 2); ctx.fill();
    }

    if (beat.accented && beat.direction !== "miss") {
      ctx.fillStyle = ACCENT_DOT; ctx.beginPath(); ctx.arc(slotLeft + drawSlotW - 10, arrowTop + 10, 4, 0, Math.PI * 2); ctx.fill();
    }

    const label  = labels[si] ?? "";
    const isBeat = si % pattern.subdivisions === 0;
    ctx.fillStyle = isBeat ? LABEL_BEAT : LABEL_SUB;
    ctx.font      = isBeat ? `bold 12px ui-sans-serif, system-ui, sans-serif` : `11px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.fillText(label, slotCX, arrowTop + ARROW_AREA_H + LABEL_H - 6); ctx.textAlign = "left";
  }
}

export function drawFrame(
  ctx: CanvasRenderingContext2D, dpr: number, canvasW: number, canvasH: number,
  pattern: StrumPattern, cursorScreenX: number, chordIdx: number,
  slotFeedback: Map<number, SlotResult>, prevSlotFeedback: Map<number, SlotResult>,
  transitionAlpha: number, micEnabled: boolean, idleCursor: boolean,
  currentRep: number, maxReps: number, drawSlotW: number,
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
  const patternWidth = totalSlots * drawSlotW;

  drawChordHeader(ctx, W, pattern, chordIdx);

  ctx.save();
  ctx.font = `bold 12px ui-sans-serif, system-ui, sans-serif`; ctx.fillStyle = "rgba(255,255,255,0.38)";
  ctx.textAlign = "right"; ctx.textBaseline = "middle";
  ctx.fillText(`Rep ${currentRep + 1} / ${maxReps}`, W - PAD, PAD + HEADER_H / 2);
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.restore();

  ctx.strokeStyle = BAR_LINE; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(PAD, arrowTop); ctx.lineTo(PAD, arrowTop + ARROW_AREA_H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(PAD + patternWidth, arrowTop); ctx.lineTo(PAD + patternWidth, arrowTop + ARROW_AREA_H); ctx.stroke();

  const isActive = cursorScreenX >= 0 && !idleCursor;
  drawSlots(ctx, pattern, totalSlots, labels, arrowTop, drawSlotW, cursorScreenX, isActive, micEnabled, slotFeedback, prevSlotFeedback, transitionAlpha);
  drawRepDots(ctx, currentRep, maxReps, W, arrowTop);
  drawCursor(ctx, cursorScreenX, arrowTop, idleCursor);

  ctx.restore();
}
