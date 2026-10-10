import { type RailEdges, railEdges } from "components/PageTabs/tabNav";
import { useEffect, useRef, useState } from "react";

/**
 * Tracks which ends of a horizontally scrolling tab rail have tabs past them — see
 * `tabNavFadeClass`. Re-measured on scroll and whenever the rail or one of its tabs changes size
 * (a translation landing, a tab appearing), so the fade follows what is actually cut off.
 */
export const useRailEdges = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState<RailEdges>({ start: false, end: false });

  useEffect(() => {
    const rail = ref.current;
    if (!rail || typeof ResizeObserver === "undefined") return undefined;

    const measure = () => {
      const next = railEdges(rail);
      setEdges((prev) =>
        prev.start === next.start && prev.end === next.end ? prev : next,
      );
    };

    // Observing fires once straight away, which takes the first measurement.
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    for (const tab of Array.from(rail.children)) observer.observe(tab);
    rail.addEventListener("scroll", measure, { passive: true });

    return () => {
      observer.disconnect();
      rail.removeEventListener("scroll", measure);
    };
  }, []);

  return { ref, edges };
};
