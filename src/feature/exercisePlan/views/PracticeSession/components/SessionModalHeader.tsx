import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { X } from "lucide-react";

import { useTimerContext } from "../contexts/TimerContext";
import { FavoriteExerciseButton } from "./FavoriteExerciseButton";

interface SessionModalHeaderProps {
  exerciseTitle: string;
  exerciseId?: string;
  currentExerciseIndex: number;
  totalExercises: number;
  onClose: () => void;
  isPlaying: boolean;
}

/**
 * Phone-portrait session header. It carries the timer too, so the practice area
 * below doesn't have to give up a whole row to it — everything the player
 * glances at (time, title, position in the plan) sits in one 48px strip that
 * never scrolls away.
 */
export const SessionModalHeader = ({
  exerciseTitle,
  exerciseId,
  currentExerciseIndex,
  totalExercises,
  onClose,
  isPlaying,
}: SessionModalHeaderProps) => {
  const { formattedTimeLeft } = useTimerContext();
  const progress = totalExercises
    ? ((currentExerciseIndex + 1) / totalExercises) * 100
    : 0;

  return (
    <div className='relative z-10 shrink-0 bg-zinc-950/70 backdrop-blur-sm'>
      <div className='flex h-12 items-center gap-2 pr-3'>
        <Button
          variant='ghost'
          size='icon'
          onClick={onClose}
          aria-label='Close session'
          className='shrink-0 text-zinc-400 hover:text-white'>
          <X className='h-5 w-5' />
        </Button>

        <div className='flex min-w-0 flex-1 items-center gap-1.5'>
          <h1 className='truncate text-sm font-semibold text-zinc-100'>
            {exerciseTitle}
          </h1>
          {exerciseId && (
            <FavoriteExerciseButton exerciseId={exerciseId} compact />
          )}
        </div>

        <span
          className={cn(
            "font-mono shrink-0 text-xl font-black tabular-nums leading-none tracking-tight transition-colors",
            isPlaying ? "text-white" : "text-zinc-500",
          )}>
          {formattedTimeLeft}
        </span>

        <span className='font-mono shrink-0 text-[11px] tabular-nums text-zinc-500'>
          {currentExerciseIndex + 1}/{totalExercises}
        </span>
      </div>

      {/* Plan progress — a value, not a divider: how far the session has come. */}
      <div className='h-0.5 w-full bg-zinc-800/60'>
        <div
          className='h-full bg-cyan-500/70 transition-all duration-300'
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
