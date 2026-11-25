import { type RefObject, useEffect, useState } from "react";

/** The scroller the session stands in — see DesktopSessionView. */
export const SESSION_SCROLLER = "[data-session-scroller]";

/** The session's bottom bar, with a breath over it. */
const BOTTOM_BAR_PX = 104;
/** Past this the board is larger than it needs to be read. */
export const FIT_MAX_PX = 360;
export const FIT_MIN_PX = 240;

/**
 * How tall the tab can be for everything under it — the keys, and the guide
 * while it is open — to stay on the screen. Only a board that fits needs no
 * shrinking by hand before playing. Null where there is nothing to measure.
 */
export function useFitTabHeight(
  boardRef: RefObject<HTMLElement | null>,
  belowRef: RefObject<HTMLElement | null> | undefined,
  enabled: boolean,
): number | null {
  const [fit, setFit] = useState<number | null>(null);

  // Not a layout effect: what stands below comes later in the tree, and its ref
  // isn't set yet while this one's layout effects run.
  useEffect(() => {
    const below = belowRef?.current;
    if (!enabled || !below || typeof ResizeObserver === "undefined") return undefined;

    const measure = () => {
      const board = boardRef.current;
      if (!board) return;
      const scroller = board.closest<HTMLElement>(SESSION_SCROLLER);
      const top = board.getBoundingClientRect().top + (scroller?.scrollTop ?? 0);
      const room = window.innerHeight - top - below.offsetHeight - BOTTOM_BAR_PX;
      setFit(Math.round(Math.min(FIT_MAX_PX, Math.max(FIT_MIN_PX, room))));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(below);
    // What stands over the board comes and goes too (the minimap, the mic's readout).
    const section = boardRef.current?.parentElement?.parentElement;
    if (section) observer.observe(section);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [boardRef, belowRef, enabled]);

  return enabled ? fit : null;
}
