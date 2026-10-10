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
 * The board turned a quarter clockwise — on an upright phone, so the tab only reads once the
 * phone is turned sideways. Its music then runs down the screen instead of across it.
 */
export const QUARTER_TURN_STYLE = {
  transform: "rotate(90deg) translateY(-100%)",
  transformOrigin: "top left",
} as const;

/**
 * Which page coordinate runs along the music: a turned board's runs down the screen, so a drag
 * along it moves the pointer in y. The turn is CSS, like the mirror, so the browser still hands
 * the pointer over in page space.
 */
export function pointerAlongBoard(
  pointer: { clientX: number; clientY: number },
  quarterTurned: boolean,
): number {
  return quarterTurned ? pointer.clientY : pointer.clientX;
}

/**
 * The board's extent along the music, in page space — for a turned board, its box's top and
 * bottom. Pair it with `pointerAlongBoard` before handing both to `boardOffsetX`.
 */
export function boardSpan(
  rect: { left: number; right: number; top: number; bottom: number },
  quarterTurned: boolean,
): { left: number; right: number } {
  return quarterTurned
    ? { left: rect.top, right: rect.bottom }
    : { left: rect.left, right: rect.right };
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
