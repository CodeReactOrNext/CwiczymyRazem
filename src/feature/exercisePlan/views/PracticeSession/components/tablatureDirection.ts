/**
 * Right-to-left board: the piece starts at the right edge and the cursor travels
 * left, mirroring the tab the way a left-handed player sees their own neck.
 *
 * The mirror is a CSS flip on the canvas element, so the renderer keeps drawing
 * in its normal coordinates and nothing about the layout maths changes. Two
 * things do not come for free, and live here so they can be tested on their own:
 * pointer coordinates (the browser hands them over in page space, which the flip
 * does not touch) and the drag direction.
 *
 * Text is the third: it would read backwards under the flip, so the worker
 * counter-flips every string it draws about its own anchor.
 */

/** CSS transform that mirrors the board, or nothing for a normal one. */
export function mirrorBoardStyle(
  rightToLeft: boolean,
): "scaleX(-1)" | undefined {
  return rightToLeft ? "scaleX(-1)" : undefined;
}

/**
 * How far into the board a pointer landed, measured from the edge the music
 * starts at — the right one when the board is mirrored. Everything downstream
 * (the gutter inset, the beat the click snaps to) is written against that edge,
 * so this is the only place the mirror has to be accounted for.
 */
export function boardOffsetX(
  clientX: number,
  rect: { left: number; right: number },
  rightToLeft: boolean,
): number {
  return rightToLeft ? rect.right - clientX : clientX - rect.left;
}

/**
 * Where a drag leaves the scroll position. Dragging the board along with the
 * direction the notes travel scrubs forwards, which is leftwards on a normal
 * board and rightwards on a mirrored one — so the mirror flips the sign.
 */
export function scrollAfterDrag(
  initScrollX: number,
  dragDeltaPx: number,
  rightToLeft: boolean,
): number {
  return Math.max(0, initScrollX + (rightToLeft ? dragDeltaPx : -dragDeltaPx));
}
