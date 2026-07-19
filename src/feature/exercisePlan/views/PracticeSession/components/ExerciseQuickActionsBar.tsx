import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import { RippleButton } from "hooks/useRipple";
import { Minus, Plus } from "lucide-react";
import { memo, useRef, useState } from "react";
import { GiMetronome } from "react-icons/gi";

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
    compact ? "h-7 w-7" : "h-8 w-8"
  );

  return (
    <div className={cn("flex w-full justify-center", compact ? "" : "mb-4")}>
      <div className={cn(
        "flex w-full items-center rounded-xl bg-zinc-800",
        // Compact fits a ~180px side panel: no icon, no slider, tighter gaps.
        compact ? "h-10 max-w-[320px] justify-between gap-2 px-2.5" : "h-12 max-w-md gap-3 px-4"
      )}>
        {!compact && <GiMetronome className="h-5 w-5 shrink-0 text-zinc-400" />}

        <RippleButton
          className={stepBtn}
          onClick={() => setBpm(Math.max(minBpm, bpm - 1))}
          disabled={bpm <= minBpm}
          title="Slower"
        >
          <Minus className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2.5} />
        </RippleButton>

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
              "w-14 shrink-0 rounded-md bg-zinc-900/60 px-1 text-center font-mono font-black tabular-nums text-white outline-none ring-2 ring-white/40",
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
          title="Faster"
        >
          <Plus className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2.5} />
        </RippleButton>
      </div>
    </div>
  );
});
