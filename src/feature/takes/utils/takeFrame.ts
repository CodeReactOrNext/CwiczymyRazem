/**
 * The picture of a video take: the tablature, with the score above it.
 *
 * The window is captured whole; what goes into the file is cut out of it — the
 * board, and the score panel when the mic is on — and laid out on a canvas of
 * its own. Session chrome (toolbars, timers, menus) is simply never copied.
 *
 * Elements opt in with `data-take-region="board" | "score"`; controls that sit
 * on top of the board carry `data-take-hide` and are hidden while a video take
 * runs (see globals.css).
 */

export interface Size {
  width: number;
  height: number;
}

export interface Box extends Size {
  x: number;
  y: number;
}

export interface TakeFramePlan extends Size {
  board: Box;
  score: Box | null;
}

/** Widest a take's picture gets — a board on an ultrawide screen is scaled down to it. */
export const TAKE_MAX_WIDTH = 1920;
/** Space around and between the regions, in CSS px. */
const TAKE_PADDING = 12;

export type TakeRegion = "board" | "score";

/** H.264 wants even dimensions; rounding down keeps the picture inside the widest allowed. */
function even(value: number) {
  return Math.max(2, Math.floor(value / 2) * 2);
}

/**
 * Lays the take's picture out, in canvas pixels.
 *
 * @param board       the board's size on the page, CSS px
 * @param score       the score panel's, or null when it is not shown
 * @param pxPerCss    captured pixels per CSS pixel
 */
export function planTakeFrame(
  board: Size,
  score: Size | null,
  pxPerCss: number,
  maxWidth = TAKE_MAX_WIDTH,
): TakeFramePlan {
  const wanted = (board.width + TAKE_PADDING * 2) * pxPerCss;
  const unit = pxPerCss * Math.min(1, maxWidth / wanted);
  const pad = Math.round(TAKE_PADDING * unit);
  const boardWidth = Math.round(board.width * unit);
  const boardHeight = Math.round(board.height * unit);

  let scoreBox: Box | null = null;
  let boardY = pad;
  if (score && score.width > 0 && score.height > 0) {
    const width = Math.min(boardWidth, Math.round(score.width * unit));
    const height = Math.round(score.height * unit);
    // Right-aligned, where it sits above the board in the session.
    scoreBox = { x: pad + boardWidth - width, y: pad, width, height };
    boardY = pad + height + pad;
  }

  return {
    width: even(boardWidth + pad * 2),
    height: even(boardY + boardHeight + pad),
    board: { x: pad, y: boardY, width: boardWidth, height: boardHeight },
    score: scoreBox,
  };
}

/** The largest box of `source`'s shape that fits in `slot`, centred in it. */
export function fitInside(source: Size, slot: Box): Box {
  if (source.width <= 0 || source.height <= 0) return { ...slot, width: 0, height: 0 };
  const scale = Math.min(slot.width / source.width, slot.height / source.height);
  const width = source.width * scale;
  const height = source.height * scale;
  return { x: slot.x + (slot.width - width) / 2, y: slot.y + (slot.height - height) / 2, width, height };
}

/** The part of a captured frame an element covers, clipped to the frame; null when none of it is in view. */
export function sourceBox(rect: Box, pxPerCss: number, frame: Size): Box | null {
  const left = Math.max(0, rect.x * pxPerCss);
  const top = Math.max(0, rect.y * pxPerCss);
  const right = Math.min(frame.width, (rect.x + rect.width) * pxPerCss);
  const bottom = Math.min(frame.height, (rect.y + rect.height) * pxPerCss);
  if (right - left < 1 || bottom - top < 1) return null;
  return { x: left, y: top, width: right - left, height: bottom - top };
}

/** The visible element marked as `region`, if the page has one. */
export function findTakeRegion(region: TakeRegion): HTMLElement | null {
  const marked = document.querySelectorAll<HTMLElement>(`[data-take-region="${region}"]`);
  for (const element of Array.from(marked)) {
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return element;
  }
  return null;
}
