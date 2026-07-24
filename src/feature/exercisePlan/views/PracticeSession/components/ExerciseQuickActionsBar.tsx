import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import { RippleButton } from "hooks/useRipple";
import { Check, Minus, Plus } from "lucide-react";
import { memo, useRef, useState } from "react";
import { GiMetronome } from "react-icons/gi";

import {
  SubdivisionIcon,
  SUBDIVISIONS,
} from "../../../components/Metronome/SubdivisionIcon";
import type { Exercise } from "../../../types/exercise.types";

interface ExerciseQuickActionsBarProps {
  exercise: Exercise;
  metronome: any;
  examMode?: boolean;
  compact?: boolean;
}

const tempoColor = (bpm: number) =>
  bpm < 80 ? "text-emerald-400" : bpm < 120 ? "text-amber-400" : "text-red-400";

const sliderRange = (bpm: number) =>
  bpm < 80
    ? "[&_[data-slot=slider-range]]:bg-emerald-500"
    : bpm < 120
      ? "[&_[data-slot=slider-range]]:bg-amber-500"
      : "[&_[data-slot=slider-range]]:bg-red-500";

export const ExerciseQuickActionsBar = memo(function ExerciseQuickActionsBar({
  exercise,
  metronome,
  examMode = false,
  compact = false,
}: ExerciseQuickActionsBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const hasMetronome = !!exercise.metronomeSpeed && !examMode;
  if (!hasMetronome) return null;

  const bpm: number = metronome.bpm;
  const setBpm = metronome.setBpm;
  const minBpm = metronome.minBpm;
  const maxBpm = metronome.maxBpm;

  const startEdit = () => {
    setInput(String(bpm));
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };
  const commit = () => {
    const parsed = parseInt(input, 10);
    if (!isNaN(parsed)) setBpm(Math.min(maxBpm, Math.max(minBpm, parsed)));
    setIsEditing(false);
  };

  const stepBtn = cn(
    "flex items-center justify-center shrink-0 rounded-lg bg-zinc-900/60 text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-40 disabled:hover:bg-zinc-900/60",
    compact ? "h-7 w-7" : "h-8 w-8",
  );

  return (
    <div className={cn("flex w-full justify-center", compact ? "" : "mb-4")}>
      <div
        className={cn(
          "flex w-full items-center rounded-xl bg-zinc-800",
          // Compact fits a ~180px side panel: no icon, no slider, tighter gaps.
          compact
            ? "h-10 max-w-[320px] justify-between gap-2 px-2.5"
            : "h-12 max-w-md gap-3 px-4",
        )}>
        {!compact && <GiMetronome className='h-5 w-5 shrink-0 text-zinc-400' />}

        <RippleButton
          className={stepBtn}
          onClick={() => setBpm(Math.max(minBpm, bpm - 1))}
          disabled={bpm <= minBpm}
          title='Slower'>
          <Minus
            className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
            strokeWidth={2.5}
          />
        </RippleButton>

        {isEditing ? (
          <input
            ref={inputRef}
            type='number'
            value={input}
            min={minBpm}
            max={maxBpm}
            onChange={(e) => setInput(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setIsEditing(false);
            }}
            className={cn(
              "font-mono w-14 shrink-0 rounded-md bg-zinc-900/60 px-1 text-center font-black tabular-nums text-white outline-none ring-2 ring-white/40",
              compact ? "text-lg" : "text-2xl",
            )}
          />
        ) : (
          <button
            onClick={startEdit}
            title='Click to edit BPM'
            className={cn(
              "font-mono shrink-0 font-black tabular-nums tracking-tight transition-transform active:scale-95",
              compact ? "text-lg" : "text-2xl",
              tempoColor(bpm),
            )}>
            {bpm}
          </button>
        )}

        {!compact && (
          <Slider
            value={[bpm]}
            min={minBpm}
            max={maxBpm}
            step={1}
            onValueChange={(v) => setBpm(v[0])}
            className={cn("flex-1 cursor-pointer", sliderRange(bpm))}
          />
        )}

        <RippleButton
          className={stepBtn}
          onClick={() => setBpm(Math.min(maxBpm, bpm + 1))}
          disabled={bpm >= maxBpm}
          title='Faster'>
          <Plus
            className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
            strokeWidth={2.5}
          />
        </RippleButton>

        {metronome.setSubdivision && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type='button'
                title='Subdivision'
                className={cn(
                  stepBtn,
                  metronome.subdivision !== 1 &&
                    "bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25",
                )}>
                <SubdivisionIcon
                  value={metronome.subdivision}
                  className={compact ? "h-4 w-4" : "h-5 w-5"}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              // Practice session is a full-screen layer at z-[999999] (desktop) / z-[9999999]
              // (mobile modal) — the dropdown's default z-50 would paint underneath it.
              className='z-[99999999] min-w-[11rem] border border-white/10 bg-zinc-900 text-white'>
              {SUBDIVISIONS.map(({ value, title }) => {
                const active = metronome.subdivision === value;
                return (
                  <DropdownMenuItem
                    key={value}
                    onSelect={() => metronome.setSubdivision(value)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 text-xs font-semibold focus:bg-zinc-800 focus:text-white",
                      active ? "text-cyan-300" : "text-zinc-300",
                    )}>
                    <SubdivisionIcon
                      value={value}
                      className='h-4 w-4 shrink-0'
                    />
                    <span>{title}</span>
                    {active && (
                      <Check className='ml-auto h-3.5 w-3.5 text-cyan-300' />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
});
