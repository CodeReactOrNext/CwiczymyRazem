import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "assets/components/ui/dropdown-menu";
import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import { Minus, Plus, Volume1, Volume2, VolumeX } from "lucide-react";
import { memo, useRef, useState } from "react";
import { GiMetronome } from "react-icons/gi";

import type { Exercise } from "../../../types/exercise.types";

interface ExerciseQuickActionsBarProps {
  exercise: Exercise;
  metronome: any;
  isMetronomeMuted: boolean;
  setIsMetronomeMuted: (v: boolean) => void;
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
  isMetronomeMuted,
  setIsMetronomeMuted,
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
  const volume: number = metronome.volume ?? 0.5;
  const setVolume = metronome.setVolume as ((v: number) => void) | undefined;

  const VolumeIcon = isMetronomeMuted || volume <= 0.0001 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

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
    compact ? "h-7 w-7" : "h-8 w-8"
  );

  return (
    <div className={cn("flex w-full justify-center", compact ? "" : "mb-4")}>
      <div className={cn(
        "flex w-full items-center gap-3 rounded-xl bg-zinc-800 shadow-lg shadow-black/30",
        compact ? "h-10 max-w-[320px] px-3" : "h-12 max-w-md px-4"
      )}>
        <GiMetronome className={cn("shrink-0 text-zinc-400", compact ? "h-4 w-4" : "h-5 w-5")} />

        <button
          className={stepBtn}
          onClick={() => setBpm(Math.max(minBpm, bpm - 1))}
          disabled={bpm <= minBpm}
          title="Slower"
        >
          <Minus className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2.5} />
        </button>

        {isEditing ? (
          <input
            ref={inputRef}
            type="number"
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
              "w-14 shrink-0 rounded-md bg-zinc-900/60 px-1 text-center font-mono font-black tabular-nums text-cyan-400 outline-none ring-2 ring-cyan-500",
              compact ? "text-lg" : "text-2xl"
            )}
          />
        ) : (
          <button
            onClick={startEdit}
            title="Click to edit BPM"
            className={cn(
              "shrink-0 font-mono font-black tabular-nums tracking-tight transition-transform active:scale-95",
              compact ? "text-lg" : "text-2xl",
              tempoColor(bpm)
            )}
          >
            {bpm}
          </button>
        )}

        <Slider
          value={[bpm]}
          min={minBpm}
          max={maxBpm}
          step={1}
          onValueChange={(v) => setBpm(v[0])}
          className={cn("flex-1 cursor-pointer", sliderRange(bpm))}
        />

        <button
          className={stepBtn}
          onClick={() => setBpm(Math.min(maxBpm, bpm + 1))}
          disabled={bpm >= maxBpm}
          title="Faster"
        >
          <Plus className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2.5} />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              title="Metronome volume"
              className={cn(
                "flex items-center justify-center shrink-0 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50",
                compact ? "h-7 w-7" : "h-8 w-8",
                isMetronomeMuted
                  ? "text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
                  : "text-cyan-400 hover:bg-cyan-500/10"
              )}
            >
              <VolumeIcon className={compact ? "h-4 w-4" : "h-5 w-5"} strokeWidth={2.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border border-white/10 bg-zinc-900 p-3 text-white">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                Metronome volume
              </span>
              <span className="font-mono text-[10px] text-zinc-500">
                {isMetronomeMuted ? "Muted" : `${Math.round(volume * 100)}%`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMetronomeMuted(!isMetronomeMuted)}
                title={isMetronomeMuted ? "Unmute metronome" : "Mute metronome"}
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                  isMetronomeMuted
                    ? "text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
                    : "text-cyan-400 hover:bg-cyan-500/10"
                )}
              >
                <VolumeIcon className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <Slider
                value={[isMetronomeMuted ? 0 : volume]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={(v) => {
                  if (isMetronomeMuted && v[0] > 0) setIsMetronomeMuted(false);
                  setVolume?.(v[0]);
                }}
                className="flex-1 cursor-pointer [&_[data-slot=slider-range]]:bg-cyan-500"
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});
