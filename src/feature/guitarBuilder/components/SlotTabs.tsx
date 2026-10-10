import { cn } from "assets/lib/utils";

import { SLOT_LABELS } from "../data/components";
import type { ComponentSlot } from "../types/guitarBuilder.types";

interface SlotTabsProps {
  slots: ComponentSlot[];
  active: ComponentSlot;
  onSelect: (slot: ComponentSlot) => void;
  /** What's fitted in a slot, e.g. "Lvl 7", or "–". */
  hint: (slot: ComponentSlot) => string;
}

/** One row of slot tabs; scrolls sideways rather than wrapping. */
export const SlotTabs = ({ slots, active, onSelect, hint }: SlotTabsProps) => (
  <div className='no-scrollbar flex gap-1 overflow-x-auto rounded-lg bg-zinc-900/60 p-1'>
    {slots.map((slot) => (
      <button
        key={slot}
        type='button'
        aria-pressed={active === slot}
        onClick={() => onSelect(slot)}
        className={cn(
          "flex h-12 min-w-[5.5rem] flex-1 shrink-0 flex-col items-center justify-center rounded-lg px-3 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400",
          active === slot
            ? "bg-zinc-800 text-zinc-50"
            : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
        )}>
        <span className='text-sm'>{SLOT_LABELS[slot]}</span>
        <span
          className={cn(
            "text-xs tabular-nums",
            active === slot ? "text-cyan-400" : "text-zinc-500",
          )}>
          {hint(slot)}
        </span>
      </button>
    ))}
  </div>
);
