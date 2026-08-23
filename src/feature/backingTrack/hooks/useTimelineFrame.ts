import type { RefObject } from "react";
import { useEffect, useRef } from "react";

/**
 * One animation frame for the whole alignment screen.
 *
 * Every lane used to run its own `requestAnimationFrame` loop — the ruler, the
 * tab, the overview, the tempo popover, the clock, and one more per stem. Nine
 * or ten independent callbacks per frame, each of which read `clientWidth` off
 * its canvas and then wrote `canvas.width` back. A layout read after a layout
 * write forces the browser to lay the page out again *inside* the frame, and
 * doing that ten times over is the difference between a frame that lands in
 * 16 ms and one that does not.
 *
 * With a single driver the reads happen once, the draws happen in a known
 * order, and the browser lays out once. It also means the screen costs nothing
 * at all while it is shut: no subscribers, no loop.
 */
type FrameFn = (now: number) => void;

const subscribers = new Set<FrameFn>();
let frame = 0;

const tick = (now: number) => {
  frame = requestAnimationFrame(tick);
  for (const draw of subscribers) {
    try {
      draw(now);
    } catch (error) {
      // One lane throwing used to kill only its own loop. Sharing a driver must
      // not turn that into a frozen screen, so the bad subscriber is dropped —
      // and rethrown out of band, where the error reporter still sees it.
      subscribers.delete(draw);
      setTimeout(() => {
        throw error;
      });
    }
  }
};

/**
 * Runs `draw` once per animation frame while the component is mounted.
 *
 * The callback is read through a ref, so it always sees fresh values without
 * the subscription being torn down and rebuilt on every render — which is what
 * happens continuously while a lane is being dragged.
 */
export function useTimelineFrame(draw: FrameFn): void {
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  });

  useEffect(() => {
    const run: FrameFn = (now) => drawRef.current(now);
    subscribers.add(run);
    if (subscribers.size === 1) frame = requestAnimationFrame(tick);

    return () => {
      subscribers.delete(run);
      if (subscribers.size === 0 && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };
  }, []);
}

export interface CanvasSize {
  /** Width in CSS pixels — 0 until the canvas has been laid out. */
  width: number;
  devicePixelRatio: number;
}

/**
 * Keeps a canvas's backing store the right size without measuring every frame.
 *
 * `canvas.clientWidth` is a layout read. Asking for it inside a draw loop, once
 * per lane, sixty times a second, is the most expensive line in a lane that
 * otherwise only pushes pixels — and it is asking for a number that changes
 * when the window is resized and at no other time.
 *
 * So it is measured when it can actually have changed, and the draw reads the
 * answer out of a ref. `ResizeObserver` is guarded because jsdom has none; the
 * fallback still gets the initial size and follows window resizes, which is
 * every case that matters outside a split-pane the tests do not have.
 */
export function useCanvasSize(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  heightPx: number,
): RefObject<CanvasSize> {
  const sizeRef = useRef<CanvasSize>({ width: 0, devicePixelRatio: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const measure = () => {
      const width = canvas.clientWidth;
      const dpr = window.devicePixelRatio || 1;
      sizeRef.current = { width, devicePixelRatio: dpr };
      if (width === 0) return;

      // Only touched on a real change: assigning `canvas.width` at all clears
      // the canvas and drops its context state, so doing it per frame would
      // throw away the very thing the frame is about to draw.
      const backingWidth = Math.round(width * dpr);
      const backingHeight = Math.round(heightPx * dpr);
      if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
        canvas.width = backingWidth;
        canvas.height = backingHeight;
      }
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    // A window dragged between monitors changes the pixel ratio without
    // changing any element's size, so the observer alone would miss it.
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [canvasRef, heightPx]);

  return sizeRef;
}
