import { cn } from "assets/lib/utils";
import { m } from "framer-motion";
import type { CSSProperties, ReactNode, Ref } from "react";

/**
 * What a stop on a road is:
 * - `done` — finished (Journey).
 * - `current` — where the player is now.
 * - `open` — reachable, not started.
 * - `locked` — not reachable yet.
 * - `later` — reachable, but further down a chain than the one to play next.
 * - `streak` — a streak to keep alive today.
 */
export type RoadTone =
  | "done"
  | "current"
  | "open"
  | "locked"
  | "later"
  | "streak";

const FACE: Record<RoadTone, string> = {
  done: "bg-emerald-500 text-zinc-950 hover:bg-emerald-400",
  current: "bg-cyan-500 text-zinc-950 hover:bg-cyan-400",
  open: "bg-zinc-700 text-zinc-100 hover:bg-zinc-600",
  locked: "bg-zinc-700 text-zinc-500",
  later: "bg-zinc-800 text-zinc-400 hover:bg-zinc-700",
  streak: "bg-orange-500 text-zinc-950 hover:bg-orange-400",
};

/** The key's lip: the same hue, a few shades down. */
const LIP: Record<RoadTone, string> = {
  done: "rgb(4,120,87)",
  // The light theme's accent is orange — its lip follows (--road-lip-current).
  current: "var(--road-lip-current, rgb(14,116,144))",
  // Light theme lifts these (globals.css → --road-lip-*): pale grey faces.
  open: "var(--road-lip-open, rgb(39,39,42))",
  locked: "var(--road-lip-locked, rgb(24,24,27))",
  later: "var(--road-lip-locked, rgb(24,24,27))",
  streak: "rgb(194,65,12)",
};

/** The ring around a selected stop — opaque, so it still cuts the road's line. */
const SELECTED_HALO: Record<RoadTone, string> = {
  done: "bg-emerald-950",
  current: "bg-cyan-950",
  open: "bg-zinc-800",
  locked: "bg-zinc-900",
  later: "bg-zinc-600",
  streak: "bg-orange-950",
};

/** `pad` is the ring around the key that cuts the road's line; `xs` keeps it thin so a tight chain still shows its line. */
const SIZES = {
  lg: { key: "h-20 w-20", lip: 7, pad: "p-2 pb-3" },
  md: { key: "h-16 w-16", lip: 6, pad: "p-2 pb-3" },
  sm: { key: "h-12 w-12", lip: 5, pad: "p-2 pb-3" },
  xs: { key: "h-[30px] w-[30px]", lip: 4, pad: "p-[3px] pb-[7px]" },
};

export interface RoadPathNodeProps {
  tone: RoadTone;
  icon: ReactNode;
  /** Read out instead of the icon. */
  title: string;
  size?: keyof typeof SIZES;
  selected?: boolean;
  /** The bouncing tag over the stop the road starts at. */
  startLabel?: string;
  /** Sits on the key's corner — Journey's tick on a finished step. */
  badge?: ReactNode;
  /**
   * `cut`: a page-coloured ring that cuts the road's line where the stop sits.
   * `none`: no ring, for a row of stops with no line behind it.
   */
  halo?: "cut" | "none";
  disabled?: boolean;
  onClick: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
}

/**
 * One stop on a road: a round key with a lip under it that sinks halfway on
 * hover and bottoms out on press, with a light across its top. Shared by
 * Journey and What Next, so a road looks the same wherever it appears.
 */
export const RoadPathNode = ({
  tone,
  icon,
  title,
  size = "lg",
  selected,
  startLabel,
  badge,
  halo = "cut",
  disabled,
  onClick,
  buttonRef,
}: RoadPathNodeProps) => {
  const locked = tone === "locked";
  // A dim key stays flat: the light across the top is for stops worth pressing now.
  const lit = !locked && tone !== "later";
  const style = {
    "--lip": LIP[tone],
    "--lip-h": `${SIZES[size].lip}px`,
  } as CSSProperties;

  return (
    <div className='relative flex flex-col items-center'>
      {startLabel && (
        <m.span
          aria-hidden
          className='absolute -top-10 z-20 whitespace-nowrap rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-950'
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
          {startLabel}
          <span className='absolute -bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-zinc-100' />
        </m.span>
      )}
      <div
        className={cn(
          "rounded-full transition-colors",
          SIZES[size].pad,
          selected
            ? SELECTED_HALO[tone]
            : halo === "cut"
              ? "bg-zinc-950"
              : "bg-transparent",
        )}>
        <button
          ref={buttonRef}
          type='button'
          onClick={onClick}
          disabled={disabled}
          aria-label={title}
          aria-pressed={selected}
          style={style}
          className={cn(
            "relative flex items-center justify-center rounded-full shadow-[0_var(--lip-h)_0_0_var(--lip)] transition-[transform,box-shadow,background-color] duration-100 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-100 disabled:cursor-not-allowed",
            !locked &&
              "hover:translate-y-[3px] hover:shadow-[0_calc(var(--lip-h)_-_3px)_0_0_var(--lip)] active:translate-y-[var(--lip-h)] active:shadow-none",
            SIZES[size].key,
            FACE[tone],
          )}>
          {lit && (
            <span
              aria-hidden
              className='light-hide pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-white/0 to-black/10'
            />
          )}
          <span className='relative'>{icon}</span>
          {badge}
        </button>
      </div>
    </div>
  );
};
