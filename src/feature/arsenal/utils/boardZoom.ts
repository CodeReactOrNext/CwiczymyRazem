import type { Point } from "./cableGeometry";

/**
 * Looking at the board closer than a phone can show it.
 *
 * A case that fills a desk is 340 pixels wide on a handset: the pedals come out
 * the size of a fingernail, which is enough to look at and not enough to work
 * on. So the deck gets a viewport of its own — the board is drawn at whatever
 * size the player pinches it to, and pushed around underneath the window.
 *
 * Only the view moves. Nothing here touches a pedal's position: the board is
 * still laid out in percentages of itself (see `pedalboardLayout`), and because
 * a scaled element still reports a scaled `getBoundingClientRect`, the drag maths
 * upstairs keeps working at any zoom without knowing this file exists.
 */

/** Life size — the whole case, edge to edge, the way a desktop sees it. */
export const MIN_ZOOM = 1;
/** Three times up: a single pedal roughly thumb-sized on a handset. */
export const MAX_ZOOM = 3;
/** What one press of the plus or minus key is worth. */
export const ZOOM_STEP = 0.5;
/**
 * How far below life size the board may go, but only full screen.
 *
 * In the page, the case is already drawn to the column's width and there is
 * nothing to be gained by making it smaller. Full screen there is: a case is
 * taller than a phone held sideways, so "show me all of it at once" is a real
 * request, and this is the answer to it.
 */
export const FIT_ZOOM = 0.5;

/** Where the board is drawn, and how big. `x`/`y` are viewport pixels. */
export interface BoardView {
  zoom: number;
  x: number;
  y: number;
}

export const AT_REST: BoardView = { zoom: MIN_ZOOM, x: 0, y: 0 };

/** `floor` is how small this particular window lets the board get. */
export const clampZoom = (zoom: number, floor: number = MIN_ZOOM) =>
  Math.min(MAX_ZOOM, Math.max(floor, zoom));

/** How far apart two fingers are. The pinch is the change in this. */
export const pinchSpan = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Where the board has to sit for the point under the fingers to stay under the
 * fingers while it grows.
 *
 * Zooming about the middle of the window instead would slide whatever the
 * player was looking at off the edge — the one thing a zoom must never do.
 *
 * `pointer` is measured from the window's own left (or top) edge.
 */
export const panForZoom = (
  pan: number,
  pointer: number,
  from: number,
  to: number,
) => pointer - ((pointer - pan) * to) / from;

/**
 * Keeps the board against the window it is seen through: it can be pushed only
 * as far as it actually overhangs, and anything smaller than the window is
 * centred in it rather than left floating against a corner.
 */
export const clampPan = (pan: number, window: number, scaled: number) =>
  scaled <= window
    ? (window - scaled) / 2
    : Math.min(0, Math.max(window - scaled, pan));

/** The whole view, snapped back inside its window. `size` is the board's own
 *  layout size, before any scaling. */
export const settleView = (
  view: BoardView,
  window: { width: number; height: number },
  size: { width: number; height: number },
): BoardView => ({
  zoom: view.zoom,
  x: clampPan(view.x, window.width, size.width * view.zoom),
  y: clampPan(view.y, window.height, size.height * view.zoom),
});
