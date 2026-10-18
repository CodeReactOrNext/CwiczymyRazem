import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { MoveHorizontal } from "lucide-react";
import { useRef, useState } from "react";

import { DRAG_COMMIT_MS } from "../utils/alignment";
import { OffsetStepper } from "./OffsetStepper";

interface ShiftAllControlProps {
  /** Where bar 1 sits in the recording, in ms — what the field shows. */
  offsetMs: number;
  /** A drag began — the caller remembers where everything was. */
  onDragStart: () => void;
  /** Everything moved `totalMs` from where the drag began; `realign: false`
   *  while the hand is still moving. Absolute on purpose: a write that lands
   *  late can never lose part of the movement. */
  onDrag: (totalMs: number, options: { realign: boolean }) => void;
  /** An arrow or a typed value: move everything by this much. */
  onStep: (deltaMs: number) => void;
  /** Seconds per pixel of the lane right now, so the bars move exactly as far
   *  as the hand does. */
  getSecondsPerPixel: () => number;
}

const formatMs = (ms: number) => `${ms > 0 ? "+" : ""}${Math.round(ms)} ms`;

/**
 * Every bar at once, sideways — the move people reach for first and could not
 * find: on the lane a drag on empty space moves the *view*, and dragging bar 1
 * moves only bar 1.
 *
 * The handle is dragged like the lane itself (the bars follow the hand one to
 * one); the arrows and the field beside it finish the job by ear.
 */
export function ShiftAllControl({
  offsetMs,
  onDragStart,
  onDrag,
  onStep,
  getSecondsPerPixel,
}: ShiftAllControlProps) {
  const { t } = useTranslation("backing_track");
  const dragRef = useRef<{ startX: number; lastCommit: number } | null>(null);
  const [draggedMs, setDraggedMs] = useState<number | null>(null);

  const totalFor = (clientX: number) =>
    dragRef.current
      ? (clientX - dragRef.current.startX) * getSecondsPerPixel() * 1000
      : 0;

  const finish = (clientX: number) => {
    if (!dragRef.current) return;
    onDrag(totalFor(clientX), { realign: true });
    dragRef.current = null;
    setDraggedMs(null);
  };

  return (
    // A strip as wide as the lane, sitting right on top of it: the recording
    // is where people reach to move things, so that is where the grip is.
    <div className='flex items-center gap-2'>
      <button
        type='button'
        onPointerDown={(event) => {
          onDragStart();
          dragRef.current = {
            startX: event.clientX,
            lastCommit: Number.NEGATIVE_INFINITY,
          };
          setDraggedMs(0);
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            /* already released */
          }
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag) return;
          const total = totalFor(event.clientX);
          setDraggedMs(total);
          // Each write re-renders the session behind the editor, so the
          // bars are told at most every DRAG_COMMIT_MS.
          const now = performance.now();
          if (now - drag.lastCommit < DRAG_COMMIT_MS) return;
          drag.lastCommit = now;
          onDrag(total, { realign: false });
        }}
        onPointerUp={(event) => finish(event.clientX)}
        onPointerCancel={(event) => finish(event.clientX)}
        title={t("shift.title")}
        className={cn(
          "flex h-9 min-w-0 flex-1 cursor-ew-resize touch-none select-none items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          draggedMs === null
            ? "bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            : "bg-zinc-700 text-zinc-100",
        )}>
        <MoveHorizontal className='h-4 w-4 shrink-0' />
        <span className='truncate tabular-nums'>
          {draggedMs === null ? t("shift.drag") : formatMs(draggedMs)}
        </span>
      </button>
      <OffsetStepper
        valueMs={offsetMs}
        onChange={(nextMs) => onStep(nextMs - offsetMs)}
        label={t("shift.label")}
        showKeys
      />
    </div>
  );
}
