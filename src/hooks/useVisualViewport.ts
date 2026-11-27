import { useEffect, useState } from "react";

export interface VisualViewportBox {
  /** How tall the visible part of the page is, in CSS pixels. */
  height: number;
  /** How far the browser has panned the visible part down the layout viewport. */
  offsetTop: number;
  /** The layout viewport's height — what `100%` of a fixed box is. */
  layoutHeight: number;
}

/** Less than this much of the layout hidden is browser chrome moving, not a keyboard. */
const KEYBOARD_MIN_PX = 120;

/**
 * The part of the window the player can actually see: on a phone, what is left above the
 * on-screen keyboard.
 *
 * A phone's keyboard doesn't shrink the layout viewport (iOS never does, Android Chrome hasn't
 * by default since 108), so a fixed full-height box keeps its bottom — the chat's composer —
 * under the keyboard, and the browser pans the whole page up to show the focused field,
 * pushing the box's top off the screen. Sizing the box to this instead keeps it where it is.
 *
 * `null` while disabled, on the server, where the browser has no visualViewport, and while the
 * page is pinch-zoomed (the visible part is then a zoomed window, not the room left by a keyboard).
 */
export const useVisualViewport = (
  enabled: boolean,
): VisualViewportBox | null => {
  const [box, setBox] = useState<VisualViewportBox | null>(null);

  useEffect(() => {
    const viewport =
      typeof window === "undefined" ? undefined : window.visualViewport;
    if (!enabled || !viewport) return undefined;

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next: VisualViewportBox | null =
          Math.abs(viewport.scale - 1) > 0.01
            ? null
            : {
                height: Math.round(viewport.height),
                offsetTop: Math.round(viewport.offsetTop),
                layoutHeight: window.innerHeight,
              };
        setBox((prev) =>
          prev &&
          next &&
          prev.height === next.height &&
          prev.offsetTop === next.offsetTop &&
          prev.layoutHeight === next.layoutHeight
            ? prev
            : next,
        );
      });
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [enabled]);

  return enabled ? box : null;
};

/** Whether `box` is the room left above an on-screen keyboard rather than the whole window. */
export const isKeyboardOpen = (box: VisualViewportBox | null): boolean =>
  !!box && box.layoutHeight - box.height > KEYBOARD_MIN_PX;
