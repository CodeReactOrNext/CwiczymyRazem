import { useEffect, useState } from "react";

/**
 * How many items of a long list to draw right now: a first screenful at once,
 * then the rest a batch per frame.
 *
 * A rig picker lists every copy the player owns, and a stash socket is not a
 * cheap thing to draw — a lit plate, grain blended over it, the art with a
 * shadow filter. Mounting a few hundred of them in the frame the dialog opens
 * froze the page; fed in batches, the dialog is on screen at once and the grid
 * fills in behind it faster than it can be scrolled.
 */
export const useProgressiveCount = (total: number, first = 12, step = 18) => {
  const [count, setCount] = useState(first);

  useEffect(() => {
    if (count >= total) return undefined;
    const frame = requestAnimationFrame(() =>
      setCount((current) => Math.min(total, current + step)),
    );
    return () => cancelAnimationFrame(frame);
  }, [count, total, step]);

  return Math.min(count, total);
};
