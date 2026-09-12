import type { RefCallback } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The rendered width of an element, kept current as it resizes.
 *
 * Tone Studio's gear is one image with controls laid on top of it, and those
 * controls have to be sized in real pixels — a knob that ignores how wide the
 * amp is drawn either overflows its panel on a narrow window or rattles around
 * in it on a wide one. The panel's size is a fixed fraction of the image, so
 * everything follows from this one number.
 *
 * Measured from a callback ref rather than an effect, because the first width
 * has to be read the instant the node exists and setState inside an effect body
 * is a lint error here (react-hooks/set-state-in-effect). ResizeObserver is
 * guarded because jsdom has none; the fallback still follows window resizes,
 * which covers everything but a split pane the tests do not have.
 */
export const useElementWidth = <T extends HTMLElement>() => {
  const [width, setWidth] = useState(0);
  const nodeRef = useRef<T | null>(null);

  const ref = useCallback<RefCallback<T>>((node) => {
    nodeRef.current = node;
    if (node) setWidth(node.clientWidth);
  }, []);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return undefined;

    const measure = () => setWidth(node.clientWidth);

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
};
