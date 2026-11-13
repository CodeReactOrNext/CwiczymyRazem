import type { StrumBeat, StrumPattern } from "feature/exercisePlan/types/exercise.types";

import type { SlotResult } from "../../hooks/useStrummingMatcher";
import { drawArrow, drawChordHeader, drawRepBar, makeLabels, swingDirection } from "./strumming.canvas";
import {
  ACTIVE_COLOR, ARROW_AREA_H, BG_COLOR, GHOST_COLOR, HEADER_H, HEADER_ROW_H,
  HIT_COLOR, INK_COLOR, MISS_COLOR, MUTED_COLOR, PAD, REP_BAR_GAP, TEXT_DIM,
  TILE_ACTIVE, TILE_BEAT, TILE_H, TILE_SUB, WRONG_COLOR,
} from "./strumming.constants";

const FONT = "ui-sans-serif, system-ui, sans-serif";

/** The wash a judged slot leaves on its tile. */
const FEEDBACK_TINT: Record<SlotResult, string> = {
  hit:   "rgba(52,211,153,0.10)",
  wrong: "rgba(251,191,36,0.12)",
  miss:  "rgba(248,113,113,0.12)",
};

function drawSlots(
  ctx: CanvasRenderingContext2D, pattern: StrumPattern,
  totalSlots: number, labels: string[], tileTop: number,
  drawSlotW: number, cursorScreenX: number, isActive: boolean,
  micEnabled: boolean, slotFeedback: Map<number, SlotResult>,
  prevSlotFeedback: Map<number, SlotResult>, transitionAlpha: number,
) {
  const roomy  = drawSlotW >= 34;
  const narrow = drawSlotW < 24;
  const inset  = roomy ? 3 : 1;
  const tile = (x: number, w: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath(); (ctx as any).roundRect(x, tileTop, w, TILE_H, Math.min(8, w / 3)); ctx.fill();
  };

  for (let si = 0; si < totalSlots; si++) {
    const beat: StrumBeat = pattern.strums[si]!;
    if (!beat) continue;

    const slotLeft = PAD + si * drawSlotW;
    const isBeat   = si % pattern.subdivisions === 0;
    // Each beat's slots sit together: a wider gap before every counted beat
    // groups "1 &" apart from "2 &" without drawing a line between them.
    const lead     = isBeat && si > 0 && roomy ? 4 : 0;
    const tileX    = slotLeft + inset + lead;
    const tileW    = drawSlotW - 2 * inset - lead;
    const tileCX   = tileX + tileW / 2;
    const isStrum  = beat.direction !== "miss";
    const isSlotActive = isActive && cursorScreenX >= slotLeft && cursorScreenX < slotLeft + drawSlotW;

    const tileColor = isSlotActive ? TILE_ACTIVE : isBeat ? TILE_BEAT : TILE_SUB;
    tile(tileX, tileW, tileColor);

    const feedback = micEnabled ? slotFeedback.get(si) : undefined;
    if (feedback) {
      tile(tileX, tileW, FEEDBACK_TINT[feedback]);
    } else if (micEnabled && transitionAlpha > 0) {
      // Last loop's verdict fades out instead of blinking off on the bar line.
      const prevFb = prevSlotFeedback.get(si);
      if (prevFb) {
        ctx.save(); ctx.globalAlpha = transitionAlpha;
        tile(tileX, tileW, FEEDBACK_TINT[prevFb]);
        ctx.restore();
      }
    }

    const color =
      feedback === "hit"   ? HIT_COLOR   :
      feedback === "wrong" ? WRONG_COLOR :
      feedback === "miss"  ? MISS_COLOR  :
      !isStrum             ? GHOST_COLOR :
      isSlotActive         ? ACTIVE_COLOR :
      beat.muted           ? MUTED_COLOR : INK_COLOR;

    drawArrow(ctx, tileCX, tileTop + 12, ARROW_AREA_H - 16, {
      direction: isStrum ? (beat.direction as "down" | "up") : swingDirection(si),
      color,
      weight:    !isStrum ? "ghost" : beat.accented ? "accent" : "normal",
      muted:     isStrum && !!beat.muted,
      tileColor,
      slotW:     drawSlotW,
    });

    ctx.fillStyle = isSlotActive ? ACTIVE_COLOR : isBeat ? INK_COLOR : TEXT_DIM;
    ctx.font      = isBeat
      ? `bold ${narrow ? 11 : 16}px ${FONT}`
      : `${narrow ? 9 : 12}px ${FONT}`;
    ctx.textAlign = "center"; ctx.fillText(labels[si] ?? "", tileCX, tileTop + TILE_H - 11); ctx.textAlign = "left";
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
  const tileTop      = PAD + HEADER_H;
  const patternWidth = totalSlots * drawSlotW;

  const repLabel = `Rep ${currentRep + 1} / ${maxReps}`;
  ctx.font = `bold 12px ${FONT}`;
  const repWidth = ctx.measureText(repLabel).width + 8;

  drawChordHeader(ctx, W, pattern, chordIdx, repWidth);

  ctx.save();
  ctx.font = `bold 12px ${FONT}`; ctx.fillStyle = TEXT_DIM;
  ctx.textAlign = "right"; ctx.textBaseline = "middle";
  ctx.fillText(repLabel, W - PAD, PAD + HEADER_ROW_H / 2);
  ctx.restore();

  const isActive    = cursorScreenX >= 0 && !idleCursor;
  const repProgress = isActive && patternWidth > 0 ? (cursorScreenX - PAD) / patternWidth : 0;
  drawSlots(ctx, pattern, totalSlots, labels, tileTop, drawSlotW, cursorScreenX, isActive, micEnabled, slotFeedback, prevSlotFeedback, transitionAlpha);
  drawRepBar(ctx, currentRep, repProgress, maxReps, W, tileTop + TILE_H + REP_BAR_GAP);

  ctx.restore();
}
