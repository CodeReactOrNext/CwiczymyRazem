import { cn } from "assets/lib/utils";
import React, { useCallback, useRef, useState } from "react";

import { TAB_BASE_HEIGHT } from "./useTablatureWorkerBridge";

export const TAB_HEIGHT_MIN = 200;
export const TAB_HEIGHT_MAX = 700;
const HEIGHT_STORAGE_KEY = "practice-tab-height";

const loadHeight = (
  storageKey: string,
  clamp: (h: number) => number
): number => {
  if (typeof window === "undefined") return TAB_BASE_HEIGHT;
  const raw = window.localStorage.getItem(storageKey);
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return clamp(isNaN(parsed) ? TAB_BASE_HEIGHT : parsed);
};

export interface TablatureHeightControls {
  height: number;
  /** persist=false during a live drag (skips a localStorage write per frame). */
  setHeight: (next: number, persist?: boolean) => void;
}

export interface TablatureHeightOptions {
  /** Own localStorage slot — a phone wants a different height than the desktop viewer. */
  storageKey?: string;
  min?: number;
  max?: number;
}

/**
 * Shared height for the practice viewers (tablature / notation), persisted to
 * localStorage. Dragging the resize handle scales the tab content and grows
 * the notation viewport.
 */
export function useTablatureHeight({
  storageKey = HEIGHT_STORAGE_KEY,
  min = TAB_HEIGHT_MIN,
  max = TAB_HEIGHT_MAX,
}: TablatureHeightOptions = {}): TablatureHeightControls {
  const clamp = useCallback(
    (h: number) => Math.round(Math.min(max, Math.max(min, h))),
    [min, max]
  );
  const [height, setHeightState] = useState<number>(() =>
    loadHeight(storageKey, clamp)
  );

  const setHeight = useCallback(
    (next: number, persist = true) => {
      const clamped = clamp(next);
      setHeightState(clamped);
      if (persist && typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, String(clamped));
      }
    },
    [clamp, storageKey]
  );

  return { height, setHeight };
}

interface TablatureResizeHandleProps {
  height: number;
  onChange: (next: number, persist?: boolean) => void;
  className?: string;
}

/**
 * Drag handle on the bottom edge of a viewer to stretch/shrink its height.
 * Double-click resets to the default. Stops pointer propagation so an
 * underlying seek/drag canvas doesn't also react.
 */
export function TablatureResizeHandle({ height, onChange, className }: TablatureResizeHandleProps) {
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = { startY: e.clientY, startH: height };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [height],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return;
      e.stopPropagation();
      onChange(dragRef.current.startH + (e.clientY - dragRef.current.startY), false);
    },
    [onChange],
  );

  const endDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return;
      dragRef.current = null;
      e.currentTarget.releasePointerCapture(e.pointerId);
      onChange(height); // persist final height
    },
    [height, onChange],
  );

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize viewer height"
      title="Drag to resize"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={() => onChange(TAB_BASE_HEIGHT)}
      className={cn(
        "group absolute inset-x-0 bottom-0 z-20 flex h-4 cursor-ns-resize touch-none select-none items-end justify-center",
        className,
      )}
    >
      <div className="mb-1 h-1 w-10 rounded-full bg-white/15 transition-colors group-hover:bg-white/40" />
    </div>
  );
}
