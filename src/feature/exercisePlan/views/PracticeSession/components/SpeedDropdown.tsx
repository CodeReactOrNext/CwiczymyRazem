import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import { RippleButton } from "hooks/useRipple";
import { Check, ChevronDown, Snail } from "lucide-react";

import { tempoColor } from "../../../components/Metronome/utils/tempoColor";

export const SPEED_MODES: { value: number; label: string }[] = [
  { value: 1, label: "100%" },
  { value: 0.75, label: "75%" },
  { value: 0.5, label: "50%" },
  { value: 0.25, label: "25%" },
];

/** The tempo the click and backing track actually run at. Rounded for display
 *  only — the audio clock schedules from the exact `bpm × speed` product. */
export const effectiveBpmLabel = (baseBpm: number, speedMultiplier: number) =>
  Math.round(baseBpm * speedMultiplier);

interface SpeedDropdownProps {
  speedMultiplier: number;
  onSpeedMultiplierChange: (value: number) => void;
  /** The BPM the slider is set to. With it the control can say what the
   *  percentage works out to ("75% = 46 BPM") — the one line that makes the
   *  link between this control and the metronome obvious. */
  baseBpm?: number;
  /** Height class (`h-8` / `h-11` / `h-12`) so the control lines up with its neighbours. */
  h: string;
  /** Icon + percentage only, for the tight landscape strip. */
  compact?: boolean;
  /** Sits inside the metronome bar: idle background matches the bar's step buttons. */
  inline?: boolean;
  className?: string;
}

/**
 * Playback-speed picker. "Speed" is the word users understand; the percentage
 * alone read as an unrelated setting, so the trigger always carries the label
 * and — once slowed — the resulting BPM, so a change here visibly lands on the
 * same unit the metronome shows.
 */
export function SpeedDropdown({
  speedMultiplier,
  onSpeedMultiplierChange,
  baseBpm,
  h,
  compact = false,
  inline = false,
  className,
}: SpeedDropdownProps) {
  const current =
    SPEED_MODES.find((m) => m.value === speedMultiplier) ?? SPEED_MODES[0];
  const isSlowed = speedMultiplier < 1;
  const effective =
    baseBpm && isSlowed ? effectiveBpmLabel(baseBpm, speedMultiplier) : null;

  const title =
    effective !== null
      ? `Playback speed ${current.label} — the click and backing track run at ${effective} BPM instead of ${baseBpm}`
      : "Playback speed — slow the click and backing track down to learn tricky passages";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <RippleButton
          title={title}
          className={cn(
            "flex items-center rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/50 active:scale-95",
            h,
            compact ? "gap-1.5 px-2" : "gap-2 px-3",
            isSlowed
              ? "bg-white/15 text-white hover:bg-white/25"
              : inline
                ? "bg-zinc-900/60 text-zinc-200 hover:bg-zinc-700 hover:text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white",
            className,
          )}>
          <Snail
            className={cn(
              "shrink-0",
              compact ? "h-3 w-3" : "h-4 w-4",
              !isSlowed && "text-zinc-400",
            )}
          />
          {!compact && (
            <span className='text-[10px] font-semibold tracking-wide'>
              Speed
            </span>
          )}
          <span
            className={cn(
              "font-mono font-bold tabular-nums",
              compact ? "text-[10px]" : "text-sm",
            )}>
            {current.label}
          </span>
          {effective !== null && (
            <span
              className={cn(
                "font-mono flex items-baseline gap-1 tabular-nums",
                compact ? "text-[10px]" : "text-sm",
              )}>
              <span className='opacity-60'>=</span>
              <span className={cn("font-bold", tempoColor(effective))}>
                {effective}
              </span>
              <span className='text-[10px] font-semibold opacity-70'>BPM</span>
            </span>
          )}
          <ChevronDown
            className={cn(
              "shrink-0 opacity-60",
              compact ? "h-3 w-3" : "h-3.5 w-3.5",
            )}
          />
        </RippleButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='center'
        // Practice session is a full-screen layer at z-[999999] (desktop) / z-[9999999]
        // (mobile modal) — the dropdown's default z-50 would paint underneath it.
        className='z-[99999999] min-w-[12rem] border border-white/10 bg-zinc-900 p-1.5 text-white'>
        <div className='select-none px-2 pb-2 pt-1'>
          <p className='text-[10px] font-bold tracking-wide text-zinc-400'>
            Playback speed
          </p>
          <p className='mt-0.5 text-[10px] leading-snug text-zinc-500'>
            Slows the click and backing track below the set BPM
          </p>
        </div>
        {SPEED_MODES.map(({ value, label }) => {
          const active = speedMultiplier === value;
          return (
            <DropdownMenuItem
              key={value}
              onSelect={() => onSpeedMultiplierChange(value)}
              className={cn(
                "flex cursor-pointer items-center gap-2 text-xs font-semibold focus:bg-zinc-800 focus:text-white",
                active ? "text-cyan-300" : "text-zinc-300",
              )}>
              <span className='font-mono w-9 tabular-nums'>{label}</span>
              {baseBpm ? (
                <span className='font-mono text-[10px] tabular-nums text-zinc-500'>
                  {effectiveBpmLabel(baseBpm, value)} BPM
                </span>
              ) : null}
              {active && (
                <Check className='ml-auto h-3.5 w-3.5 text-cyan-300' />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
