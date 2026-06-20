import { cn } from "assets/lib/utils";
import { useEffect, useRef, useState } from "react";

const SIZE = 120;

interface RippleProps {
  /** Tailwind bg color class for the ripple, e.g. "bg-white/30". */
  className?: string;
}

/**
 * Drop inside any clickable element to add a click ripple.
 * The parent must be `position: relative`. The ripple clips itself,
 * so the parent does not need `overflow-hidden`.
 */
export const Ripple = ({ className }: RippleProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;

    const handler = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const rect = parent.getBoundingClientRect();
      setRipples((prev) => [
        ...prev,
        { id: idRef.current++, x: e.clientX - rect.left, y: e.clientY - rect.top },
      ]);
    };

    parent.addEventListener("pointerdown", handler);
    return () => parent.removeEventListener("pointerdown", handler);
  }, []);

  return (
    <span
      ref={ref}
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          onAnimationEnd={() =>
            setRipples((prev) => prev.filter((p) => p.id !== r.id))
          }
          style={{ left: r.x, top: r.y, width: SIZE, height: SIZE }}
          className={cn(
            "absolute rounded-full bg-white/30 animate-ripple",
            className
          )}
        />
      ))}
    </span>
  );
};
