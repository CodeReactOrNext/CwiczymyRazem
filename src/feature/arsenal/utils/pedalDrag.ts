/**
 * The gesture that picks a pedal up off the board.
 *
 * Pointer events rather than mouse ones, so one set of rules carries a cursor
 * and a finger alike — which is the whole reason this exists: the board used to
 * be mouse-only, and a phone could look at a rig but never rearrange one.
 *
 * What lives here is only the part that makes a single press mean two things.
 * The board's geometry is in `pedalboardLayout`; this is the hand.
 */

/** How far a press travels, in viewport pixels, before it becomes a drag. */
export const DRAG_THRESHOLD = 6;

/** How far down a carried pedal a finger holds it — near the bottom edge. */
const TOUCH_GRAB = 0.85;

/**
 * Has this press travelled far enough to be a drag rather than a tap?
 *
 * The same press is also how a pedal's card is opened on a touch screen, so
 * until it has moved, it is neither — it is a press that has not decided yet.
 *
 * Manhattan distance: a square root is not worth it for six pixels, and a
 * straight swipe crosses the line at the same place either way.
 */
export const hasLeftTheTap = (
  start: { x: number; y: number },
  point: { x: number; y: number },
  threshold: number = DRAG_THRESHOLD,
) => Math.abs(point.x - start.x) + Math.abs(point.y - start.y) >= threshold;

/**
 * Where the carried pedal hangs off the pointer, top to bottom, in board
 * percent — the distance from the pointer up to the pedal's own top edge.
 *
 * A cursor is a few pixels wide and sits beside what it carries. A fingertip is
 * wider than the pedal and sits squarely on top of it, so a touch drag hands the
 * pedal back the moment it comes off the deck: it rides just above the finger,
 * held near its own bottom edge, and the player can see what they are aiming at.
 * A mouse keeps the offset it grabbed, because nothing is covering anything.
 */
export const grabOffsetY = (
  pointerType: string,
  grabbedAtPct: number,
  pedalHPct: number,
) => (pointerType === "mouse" ? grabbedAtPct : pedalHPct * TOUCH_GRAB);
