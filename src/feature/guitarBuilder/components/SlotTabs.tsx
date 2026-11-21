import { cn } from "assets/lib/utils";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";

import type { ComponentSlot } from "../types/guitarBuilder.types";

interface SlotTabsProps {
  slots: ComponentSlot[];
  active: ComponentSlot;
  onSelect: (slot: ComponentSlot) => void;
  /** A second line under the name — the shelf's count of parts in the slot. */
  hint?: (slot: ComponentSlot) => string;
  /**
   * Whether the slot has a part on the build. The bench marks it with a dot:
   * which slots are still open is the one thing the tabs have to say there —
   * the levels are on the plate beside them.
   */
  filled?: (slot: ComponentSlot) => boolean;
}

/** One row of slot tabs; scrolls sideways rather than wrapping. */
export const SlotTabs = ({
  slots,
  active,
  onSelect,
  hint,
  filled,
}: SlotTabsProps) => {
  const labels = useArsenalLabels();

  return (
  <div className='no-scrollbar flex gap-1 overflow-x-auto rounded-lg bg-zinc-900/60 p-1'>
    {slots.map((slot) => (
      <button
        key={slot}
        type='button'
        aria-pressed={active === slot}
        onClick={() => onSelect(slot)}
        className={cn(
          "flex min-w-[5.5rem] flex-1 shrink-0 flex-col items-center justify-center rounded-lg px-3 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400",
          hint ? "h-12" : "h-10",
          active === slot
            ? "bg-zinc-800 text-zinc-50"
            : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
        )}>
        <span className='flex items-center gap-1.5 text-sm'>
          {labels.slot(slot)}
          {filled?.(slot) && (
            <span
              aria-hidden
              className='h-1.5 w-1.5 rounded-full bg-zinc-300'
            />
          )}
        </span>
        {hint && (
          <span className='text-xs tabular-nums text-zinc-500'>
            {hint(slot)}
          </span>
        )}
      </button>
    ))}
  </div>
  );
};
