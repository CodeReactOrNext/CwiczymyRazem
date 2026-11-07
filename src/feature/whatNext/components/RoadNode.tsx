import { PRESSABLE } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { m } from "framer-motion";
import type { LucideIcon } from "lucide-react";

type RoadNodeTone = "current" | "next" | "chest" | "streak";

const TONES: Record<RoadNodeTone, string> = {
  current: "bg-cyan-500 text-zinc-950 border-b-cyan-700 hover:bg-cyan-400",
  next: "bg-zinc-800 text-zinc-300 border-b-zinc-950/70 hover:bg-zinc-700",
  chest: "bg-amber-500 text-zinc-950 border-b-amber-700 hover:bg-amber-400",
  streak: "bg-orange-500 text-zinc-950 border-b-orange-700 hover:bg-orange-400",
};

interface RoadNodeProps {
  icon: LucideIcon;
  label: string;
  tone: RoadNodeTone;
  size: "lg" | "md" | "sm";
  selected: boolean;
  /** The bouncing "Start" over the step the road begins with. */
  startLabel?: string;
  onClick: () => void;
}

const SIZES = {
  lg: { button: "h-20 w-20 border-b-[6px]", icon: 32 },
  md: { button: "h-16 w-16 border-b-[5px]", icon: 26 },
  sm: { button: "h-12 w-12 border-b-4", icon: 20 },
};

/**
 * One stop on the road: a round key that sinks when pressed, like every other
 * key in the app — only bigger. The selected stop sits in a soft halo of its
 * own colour, so it reads as "you are here" without a line around it.
 */
export const RoadNode = ({
  icon: Icon,
  label,
  tone,
  size,
  selected,
  startLabel,
  onClick,
}: RoadNodeProps) => (
  <div className='relative flex flex-col items-center'>
    {startLabel && (
      <m.span
        aria-hidden
        className='absolute -top-11 z-10 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-950'
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
        {startLabel}
        <span className='absolute -bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-zinc-100' />
      </m.span>
    )}
    <span
      className={cn(
        "rounded-full transition-colors",
        size === "lg" ? "p-2" : "p-1.5",
        selected &&
          (tone === "chest"
            ? "bg-amber-500/15"
            : tone === "streak"
              ? "bg-orange-500/15"
              : "bg-cyan-500/15"),
      )}>
      <button
        type='button'
        aria-label={label}
        aria-pressed={selected}
        onClick={onClick}
        className={cn(
          PRESSABLE,
          "flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-100",
          SIZES[size].button,
          TONES[tone],
        )}>
        <Icon size={SIZES[size].icon} strokeWidth={2.5} aria-hidden />
      </button>
    </span>
  </div>
);
