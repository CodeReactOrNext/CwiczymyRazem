import { cn } from "assets/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { useState } from "react";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

/**
 * Material-style click ripple. Returns an `onClick` handler that spawns a
 * ripple at the cursor position, and a `ripple` element to render inside a
 * `relative` (ideally rounded) parent.
 *
 * Usage:
 *   const { createRipple, ripple } = useRipple();
 *   <button className="relative ..." onClick={(e) => { createRipple(e); ... }}>
 *     {ripple}
 *     ...
 *   </button>
 */
export const useRipple = (colorClass = "bg-white/25") => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const createRipple = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setRipples((prev) => [
      ...prev,
      { id, x: e.clientX - rect.left, y: e.clientY - rect.top },
    ]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  };

  const ripple = (
    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            initial={{ opacity: 0.5, scale: 0 }}
            animate={{ opacity: 0, scale: 4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full ${colorClass}`}
            style={{ left: r.x, top: r.y }}
          />
        ))}
      </AnimatePresence>
    </span>
  );

  return { createRipple, ripple };
};

/**
 * Drop-in replacement for a native `<button>` that adds a click ripple.
 * Forwards ref and spreads all props, so it works inside Radix `asChild`
 * triggers (Tooltip, DropdownMenu, …).
 */
export const RippleButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { rippleColor?: string }
>(({ className, children, onClick, rippleColor, ...props }, ref) => {
  const { createRipple, ripple } = useRipple(rippleColor);
  return (
    <button
      ref={ref}
      className={cn("relative", className)}
      onClick={(e) => {
        createRipple(e);
        onClick?.(e);
      }}
      {...props}>
      {ripple}
      {children}
    </button>
  );
});
RippleButton.displayName = "RippleButton";
