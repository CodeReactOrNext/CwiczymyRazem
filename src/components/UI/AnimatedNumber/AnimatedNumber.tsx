import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  /** Animation duration in ms. */
  duration?: number;
  className?: string;
}

/**
 * Counts up to `value` whenever it changes, giving stats that "tick up" the way
 * native apps do. Respects prefers-reduced-motion (jumps straight to the value).
 */
export const AnimatedNumber = ({
  value,
  duration = 800,
  className,
}: AnimatedNumberProps) => {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const from = fromRef.current;
    const to = value;
    if (prefersReduced || from === to) {
      setDisplay(to);
      fromRef.current = to;
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      fromRef.current = to;
    };
  }, [value, duration]);

  return <span className={className}>{display.toLocaleString()}</span>;
};
