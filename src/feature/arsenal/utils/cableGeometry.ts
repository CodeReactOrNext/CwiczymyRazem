import type { BoardGeometry } from "./pedalboardLayout";

/**
 * The units and the corner-rounding both looms on the board are drawn in.
 *
 * There are two of them now — the signal path and the power loom — and they have
 * to agree about where a point on the board is, or a power cable would arrive at
 * a pedal the signal cable left somewhere else. So the board's own coordinate
 * space lives here rather than in either loom, and both draw into it.
 *
 * Board units, not pixels: ten to the board unit, so a `160 × 70` space for the
 * old 16/7 deck and a wider one for a bigger case. A stroke width therefore
 * means the same *real* thickness on every case in the game — a cable does not
 * get fatter because the board it crosses got smaller, which is exactly what
 * would happen if the space were normalised instead of scaled.
 */

export interface Point {
  x: number;
  y: number;
}

/** Board percent — what placements are stored in — to board units. */
export const toView = (
  geo: BoardGeometry,
  xPct: number,
  yPct: number,
): Point => ({
  x: (xPct / 100) * geo.viewW,
  y: (yPct / 100) * geo.viewH,
});

export const at = (p: Point) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;

/**
 * Walks a route and rounds off every corner, so a cable bends where a real one
 * would instead of kinking. Corners tighter than the bend radius borrow half the
 * shorter leg, and a corner sitting on top of its neighbour is dropped rather
 * than drawn as a spike.
 *
 * `bend` is the radius, and it is per-loom rather than fixed: a fat instrument
 * lead will not turn as tightly as the thin DC cable running beside it, and a
 * power cable drawn with the signal cable's radius reads as the wrong gauge
 * before anything else about it does.
 */
export const routed = (points: Point[], bend: number): string => {
  const parts = [`M ${at(points[0])}`];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const here = points[i];
    const next = points[i + 1];
    const inLen = Math.hypot(here.x - prev.x, here.y - prev.y);
    const outLen = Math.hypot(next.x - here.x, next.y - here.y);
    if (inLen < 0.05 || outLen < 0.05) continue;

    const back = Math.min(bend, inLen / 2) / inLen;
    const on = Math.min(bend, outLen / 2) / outLen;
    parts.push(
      `L ${at({
        x: here.x + (prev.x - here.x) * back,
        y: here.y + (prev.y - here.y) * back,
      })}`,
      `Q ${at(here)} ${at({
        x: here.x + (next.x - here.x) * on,
        y: here.y + (next.y - here.y) * on,
      })}`,
    );
  }

  parts.push(`L ${at(points[points.length - 1])}`);
  return parts.join(" ");
};

/**
 * A straight leg with a point dropped into the middle of it, so `routed` bows it
 * instead of ruling it. No cable long enough to cross a board lies flat, and the
 * dip is the whole difference between a cable and a drawn line.
 *
 * Legs shorter than `least` are handed back untouched — a sag on a two-unit hop
 * reads as a kink rather than as weight.
 */
export const sagged = (a: Point, b: Point, drop: number, least = 8): Point[] =>
  Math.hypot(b.x - a.x, b.y - a.y) < least
    ? [a, b]
    : [a, { x: (a.x + b.x) / 2, y: Math.max(a.y, b.y) + drop }, b];
