import { cn } from "assets/lib/utils";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useRef, useState } from "react";

interface KnobProps {
  label: string;
  value: number; // 0..1
  onChange: (value: number) => void;
  displayValue?: string;
  size?: number;
  accent?: "cyan" | "amber" | "emerald" | "orange" | "purple";
  disabled?: boolean;
}

const ACCENT_HEX: Record<NonNullable<KnobProps["accent"]>, string> = {
  cyan: "#22d3ee",
  amber: "#fbbf24",
  emerald: "#34d399",
  orange: "#fb923c",
  purple: "#a855f7",
};

const MIN_DEG = -135;
const MAX_DEG = 135;
const SWEEP_DEG = MAX_DEG - MIN_DEG; // 270deg — a real dial's travel, gap at the bottom
const DRAG_RANGE_PX = 160; // vertical px dragged for a full 0..1 sweep

/**
 * Rotary hardware-style control (drag vertically to change value). A conic-gradient
 * level ring shows the current position at a glance — the "plugin knob" signature
 * look — around a metal knob face styled after feature/arsenal's pedalboard visuals.
 */
export const Knob = ({ label, value, onChange, displayValue, size = 64, accent = "cyan", disabled }: KnobProps) => {
  const [dragging, setDragging] = useState(false);
  const dragState = useRef<{ startY: number; startValue: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragState.current = { startY: e.clientY, startValue: value };
      setDragging(true);
    },
    [disabled, value]
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragState.current) return;
      const dy = dragState.current.startY - e.clientY;
      const next = Math.min(1, Math.max(0, dragState.current.startValue + dy / DRAG_RANGE_PX));
      onChange(next);
    },
    [onChange]
  );

  const handlePointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    dragState.current = null;
    setDragging(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  }, []);

  const deg = MIN_DEG + value * SWEEP_DEG;
  const hex = ACCENT_HEX[accent];
  const sweepPct = (value * SWEEP_DEG * 100) / 360; // filled portion of the ring, as % of a full circle
  const trackPct = (SWEEP_DEG * 100) / 360; // full dial travel as % of a full circle (75%)

  return (
    <div className='flex select-none flex-col items-center gap-1.5'>
      <div
        role='slider'
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={value}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "ArrowUp" || e.key === "ArrowRight") onChange(Math.min(1, value + 0.02));
          if (e.key === "ArrowDown" || e.key === "ArrowLeft") onChange(Math.max(0, value - 0.02));
        }}
        style={{
          width: size,
          height: size,
          padding: Math.max(3, Math.round(size * 0.06)),
          background: `conic-gradient(from ${MIN_DEG}deg, ${hex} 0%, ${hex} ${sweepPct}%, #3f3f46 ${sweepPct}% ${trackPct}%, transparent ${trackPct}% 100%)`,
          filter: dragging ? `drop-shadow(0 0 6px ${hex}99)` : undefined,
        }}
        className={cn(
          "relative flex-shrink-0 cursor-ns-resize touch-none rounded-full transition-[filter] focus-visible:outline-none",
          disabled && "cursor-not-allowed opacity-40"
        )}>
        <div
          className='relative h-full w-full rounded-full'
          style={{
            background: "radial-gradient(circle at 35% 28%, #58585c 0%, #2a2a2d 45%, #131315 100%)",
            boxShadow: "inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -3px 7px rgba(0,0,0,0.65), 0 3px 5px rgba(0,0,0,0.5)",
          }}>
          <div
            className='absolute bottom-1/2 left-1/2 h-[36%] w-[3px] origin-bottom rounded-full'
            style={{
              background: `linear-gradient(to top, #e4e4e7 0%, #e4e4e7 75%, ${hex} 100%)`,
              transform: `translateX(-50%) rotate(${deg}deg)`,
            }}
          />
          <div
            className='absolute inset-[26%] rounded-full'
            style={{ background: "radial-gradient(circle at 40% 32%, #616165, #17171a)" }}
          />
        </div>
      </div>
      <div className='flex flex-col items-center gap-0'>
        <span className='text-[11px] text-zinc-400'>{label}</span>
        <span className='text-[11px] font-medium text-zinc-200'>{displayValue ?? Math.round(value * 100)}</span>
      </div>
    </div>
  );
};
