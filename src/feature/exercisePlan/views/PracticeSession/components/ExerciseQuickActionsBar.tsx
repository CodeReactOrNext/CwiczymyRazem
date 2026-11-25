import { PRESSABLE_KEY } from "assets/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Check, Lock, Minus, Plus, RotateCcw } from "lucide-react";
import { memo, useRef, useState } from "react";

import { AccentGrid } from "../../../components/Metronome/AccentGrid";
import {
  SubdivisionIcon,
  SUBDIVISIONS,
} from "../../../components/Metronome/SubdivisionIcon";
import {
  MAX_BEATS_PER_BAR,
  MIN_BEATS_PER_BAR,
} from "../../../components/Metronome/utils/accentPattern";
import {
  tempoColor,
  tempoSliderRange,
} from "../../../components/Metronome/utils/tempoColor";
import type { Exercise } from "../../../types/exercise.types";
import { SessionTooltip } from "./SessionTooltip";
import { SpeedDropdown } from "./SpeedDropdown";

interface ExerciseQuickActionsBarProps {
  exercise: Exercise;
  metronome: any;
  examMode?: boolean;
  compact?: boolean;
  /** Playback speed. Pass both to fold the speed picker into the bar, right
   *  next to the BPM it scales. Left out by the layouts that stack the picker
   *  underneath instead (mobile sheet, landscape strip). */
  speedMultiplier?: number;
  onSpeedMultiplierChange?: (value: number) => void;
}

export const ExerciseQuickActionsBar = memo(function ExerciseQuickActionsBar({
  exercise,
  metronome,
  examMode = false,
  compact = false,
  speedMultiplier,
  onSpeedMultiplierChange,
}: ExerciseQuickActionsBarProps) {
  const { t } = useTranslation(["session", "metronome"]);
  const [isEditing, setIsEditing] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const hasMetronome = !!exercise.metronomeSpeed && !examMode;
  if (!hasMetronome) return null;

  // The meter drills own their click grid — see Exercise.metronomeGrid.
  const accentLocked: boolean = !!metronome.accentLocked;
  // "3/4", or "3/4 ↔ 5/8" for a grid that spans a meter change.
  const gridLabel: string | null = metronome.gridLabel ?? null;

  const bpm: number = metronome.bpm;
  const setBpm = metronome.setBpm;
  const minBpm = metronome.minBpm;
  const maxBpm = metronome.maxBpm;
  const recommendedBpm: number | undefined = metronome.recommendedBpm;
  const canReset =
    typeof recommendedBpm === "number" && !!metronome.handleSetRecommendedBpm && bpm !== recommendedBpm;

  // The meter as a guitarist reads it: the exercise's own ("7/8"), or the
  // beat count over quarters. A grid that changes meter keeps the bare count.
  const beats: number = metronome.accentPattern?.length ?? 4;
  const meterLabel = accentLocked && gridLabel && !gridLabel.includes("↔") ? gridLabel : `${beats}/4`;

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
    PRESSABLE_KEY,
    "flex items-center justify-center shrink-0 rounded-lg bg-zinc-900/60 text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-40 disabled:hover:bg-zinc-900/60",
    compact ? "h-7 w-7" : "h-9 w-9",
  );

  // The compact strip has no room for the picker; those layouts stack it below.
  const showSpeed =
    !compact && speedMultiplier !== undefined && !!onSpeedMultiplierChange;

  return (
    <div className={cn("flex w-full justify-center", compact ? "" : "mb-4")}>
      <div
        className={cn(
          "flex w-full items-center rounded-xl bg-zinc-800",
          // Compact is the phone's tools drawer: no icon, no slider, tighter gaps —
          // as wide and as tall as the keys it sits under.
          compact
            ? "h-12 justify-between gap-2 rounded-lg px-2.5"
            : "relative h-14 gap-3 px-2.5",
          // The speed picker ("Speed 75% = 46 BPM") needs the extra width or
          // the slider shrinks to nothing.
          !compact && (showSpeed ? "max-w-2xl" : "max-w-md"),
        )}>
        <SessionTooltip label={t("quick.slower_hint")} keys={["↓"]}>
          <button
            type='button'
            className={stepBtn}
            onClick={() => setBpm(Math.max(minBpm, bpm - 1))}
            disabled={bpm <= minBpm}
            aria-label={t("quick.slower")}>
            <Minus
              className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
              strokeWidth={2.5}
            />
          </button>
        </SessionTooltip>

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
          <SessionTooltip label={t("quick.tempo_type")}>
            <button
              onClick={startEdit}
              aria-label={t("quick.edit_bpm")}
              className={cn(
                "shrink-0 tabular-nums transition-transform active:scale-95",
                compact
                  ? cn("font-mono text-lg font-black tracking-tight", tempoColor(bpm))
                  : "flex w-14 flex-col items-center",
              )}>
              {compact ? (
                bpm
              ) : (
                <>
                  <span className={cn("pt-1.5 font-teko text-[40px] font-semibold leading-[0.8]", tempoColor(bpm))}>{bpm}</span>
                  <span translate='no' className='text-[11px] font-medium leading-none text-zinc-500'>
                    bpm
                  </span>
                </>
              )}
            </button>
          </SessionTooltip>
        )}

        {!compact && (
          <Slider
            value={[bpm]}
            min={minBpm}
            max={maxBpm}
            step={1}
            onValueChange={(v) => setBpm(v[0])}
            className={cn("flex-1 cursor-pointer", tempoSliderRange(bpm))}
          />
        )}

        <SessionTooltip label={t("quick.faster_hint")} keys={["↑"]}>
          <button
            type='button'
            className={stepBtn}
            onClick={() => setBpm(Math.min(maxBpm, bpm + 1))}
            disabled={bpm >= maxBpm}
            aria-label={t("quick.faster")}>
            <Plus
              className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
              strokeWidth={2.5}
            />
          </button>
        </SessionTooltip>

        {metronome.setSubdivision && (
          <DropdownMenu>
            <SessionTooltip label={t("quick.subdivision_hint")}>
              <DropdownMenuTrigger asChild>
                <button
                  type='button'
                  aria-label={t("quick.subdivision")}
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
            </SessionTooltip>
            <DropdownMenuContent
              align='end'
              // Practice session is a full-screen layer at z-[999999] (desktop) / z-[9999999]
              // (mobile modal) — the dropdown's default z-50 would paint underneath it.
              className='z-[99999999] min-w-[11rem]'>
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
                    <span>{t(`metronome:subdivisions.${value}`, title)}</span>
                    {active && (
                      <Check className='ml-auto h-3.5 w-3.5 text-cyan-300' />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {metronome.accentPattern && metronome.setBeatsPerBar && metronome.cycleBeatAccent && (
          <DropdownMenu>
            <SessionTooltip
              label={
                accentLocked
                  ? `${t("quick.accents_set")}${gridLabel ? ` (${gridLabel})` : ""}`
                  : t("quick.beats_accents")
              }>
              <DropdownMenuTrigger asChild>
                <button
                  type='button'
                  aria-label={t("quick.beats_per_bar")}
                  className={cn(
                    stepBtn,
                    "font-mono text-xs font-bold",
                    !compact && "w-auto min-w-9 px-2",
                    accentLocked && "text-amber-400",
                  )}>
                  {compact ? metronome.accentPattern.length : meterLabel}
                </button>
              </DropdownMenuTrigger>
            </SessionTooltip>
            <DropdownMenuContent
              align='end'
              // Practice session is a full-screen layer at z-[999999] (desktop) / z-[9999999]
              // (mobile modal) — the dropdown's default z-50 would paint underneath it.
                className='z-[99999999] w-64 p-3'>
              <div className='flex items-center justify-between px-0.5'>
                <span className='select-none text-xs font-bold text-zinc-500'>
                  {accentLocked && gridLabel ? gridLabel : t("quick.beats_per_bar")}
                </span>
                {accentLocked ? (
                  <span className='flex select-none items-center gap-1 text-xs font-bold text-amber-400'>
                    <Lock className='h-3 w-3' />
                    {metronome.accentPattern.length}
                  </span>
                ) : (
                  <div className='flex items-center gap-1'>
                    <button
                      type='button'
                      onClick={() => metronome.setBeatsPerBar(metronome.accentPattern.length - 1)}
                      disabled={metronome.accentPattern.length <= MIN_BEATS_PER_BAR}
                      aria-label={t("metronome:remove_beat")}
                      className='flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-40'>
                      <Minus className='h-3 w-3' strokeWidth={2.5} />
                    </button>
                    <span translate='no' className='w-4 select-none text-center text-xs font-bold tabular-nums text-zinc-300'>
                      {metronome.accentPattern.length}
                    </span>
                    <button
                      type='button'
                      onClick={() => metronome.setBeatsPerBar(metronome.accentPattern.length + 1)}
                      disabled={metronome.accentPattern.length >= MAX_BEATS_PER_BAR}
                      aria-label={t("metronome:add_beat")}
                      className='flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-40'>
                      <Plus className='h-3 w-3' strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>

              <div className='mt-2'>
                <AccentGrid
                  pattern={metronome.accentPattern}
                  barLengths={metronome.gridBarLengths}
                  currentBeat={metronome.currentBeat}
                  isPlaying={metronome.isPlaying}
                  locked={accentLocked}
                  onCycle={metronome.cycleBeatAccent}
                />
              </div>

              <p className='mt-2 select-none text-xs text-zinc-500'>
                {accentLocked
                  ? gridLabel?.includes("↔")
                    ? t("metronome:accent.follows_tab")
                    : t("metronome:accent.from_exercise")
                  : t("metronome:accent.hint")}
              </p>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Speed lives in the same bar as the BPM it scales — a separate button
            read as an unrelated setting. The trigger spells out the result
            ("75% = 46 BPM") so the link is visible without opening anything. */}
        {showSpeed && (
          <SpeedDropdown
            inline
            h='h-9'
            className='ml-1'
            speedMultiplier={speedMultiplier}
            onSpeedMultiplierChange={onSpeedMultiplierChange}
            baseBpm={bpm}
          />
        )}

        {/* Back to the exercise's tempo, shown only once it has moved off it.
            Hangs off the bar's end so it never shifts the bar when it comes and goes. */}
        {!compact && canReset && (
          <span className='absolute inset-y-0 left-full flex items-center pl-2.5'>
            <SessionTooltip label={t("quick.tempo_reset")} keys={["Enter"]}>
              <button
                type='button'
                onClick={metronome.handleSetRecommendedBpm}
                aria-label={t("quick.tempo_reset")}
                className={cn(
                  PRESSABLE_KEY,
                  "flex h-9 items-center gap-1.5 rounded-lg bg-zinc-800 px-2.5 text-[13px] font-medium tabular-nums text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-100",
                )}>
                <RotateCcw className='h-3.5 w-3.5' />
                {recommendedBpm}
              </button>
            </SessionTooltip>
          </span>
        )}
      </div>
    </div>
  );
});
