/**
 * One animation frame for every animated cosmetic canvas on the page.
 *
 * A feed can hold a dozen bannered rows, so they all paint from a single
 * `requestAnimationFrame`, only while they are on screen, at no more than 2×
 * the pixel ratio. With reduced motion asked for, each draws one still frame
 * and never joins the loop.
 */

export type CanvasDraw = (seconds: number) => void;

/** Called on mount and on every resize, in CSS pixels; returns the frame painter. */
export type CanvasSetup = (
  g: CanvasRenderingContext2D,
  width: number,
  height: number,
) => CanvasDraw;

const active = new Set<CanvasDraw>();
let frame = 0;

const tick = (now: number) => {
  const seconds = now / 1000;
  active.forEach((draw) => draw(seconds));
  frame = active.size ? requestAnimationFrame(tick) : 0;
};

/** Small seeded generator, so a drawing is the same on every visit. */
export const seeded = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Runs a canvas until the returned cleanup is called — made for a `useEffect` body. */
export const runCanvas = (
  canvas: HTMLCanvasElement | null,
  setup: CanvasSetup,
): (() => void) | undefined => {
  const g = canvas?.getContext("2d");
  if (!canvas || !g) return undefined;

  const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let paint: CanvasDraw = () => {};
  const draw: CanvasDraw = (seconds) => paint(seconds);

  const build = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    paint = setup(g, width, height);
    paint(performance.now() / 1000);
  };
  build();

  const visibility = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !still) {
      active.add(draw);
      if (!frame) frame = requestAnimationFrame(tick);
    } else {
      active.delete(draw);
    }
  });
  visibility.observe(canvas);

  const size = new ResizeObserver(build);
  size.observe(canvas);

  return () => {
    visibility.disconnect();
    size.disconnect();
    active.delete(draw);
  };
};
