import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { memo } from "react";

import type { ExercisePlan } from "../../../types/exercise.types";
import { useTimerContext } from "../contexts/TimerContext";
import { getExerciseFill } from "../utils/sessionProgress";

interface ExerciseProgressProps {
  plan: ExercisePlan;
  currentExerciseIndex: number;
  completedExercises: number[];
  /** Time put into each exercise that is not on screen, in ms, by index. */
  exerciseTimes: Record<number, number>;
  /** Left out where the bar only reports — the phone moves with its own keys. */
  onExerciseSelect?: (index: number) => void;
  /** The phone's thin line. */
  slim?: boolean;
}

const Fill = ({ percent, slim }: { percent: number; slim?: boolean }) => (
  <div
    className='relative h-full bg-cyan-500 transition-[width] duration-slow ease-linear'
    style={{ width: `${percent}%` }}>
    {!slim && percent > 8 && (
      <span aria-hidden className='light-hide absolute inset-x-1.5 top-[3px] h-[3px] rounded-full bg-white/30' />
    )}
  </div>
);

/** The exercise on screen fills with its clock; reading it here keeps a tick to this one element. */
const CurrentFill = ({ slim }: { slim?: boolean }) => {
  const { progress } = useTimerContext();
  return <Fill percent={progress} slim={slim} />;
};

/**
 * How far into the session the player is: one bar across the top, cut into the
 * plan's exercises. Every part fills with the time really put into it, so it
 * reads empty before the first note and full after the last.
 */
export const ExerciseProgress = memo(function ExerciseProgress({
  plan,
  currentExerciseIndex,
  completedExercises,
  exerciseTimes,
  onExerciseSelect,
  slim = false,
}: ExerciseProgressProps) {
  const { t } = useTranslation("session");
  const isSingle = plan.exercises.length === 1;

  return (
    <div className={cn("flex w-full", slim ? "h-1 gap-px" : "h-5 items-center gap-0.5")}>
      {plan.exercises.map((exercise, idx) => {
        const isActive = idx === currentExerciseIndex;
        const title = exercise.songData?.title ?? exercise.title;
        const bar = (
          <div
            className={cn(
              "w-full overflow-hidden bg-zinc-800 transition-colors duration-fast",
              slim ? "h-1" : "h-3",
              !slim && idx === 0 && "rounded-l-full",
              !slim && idx === plan.exercises.length - 1 && "rounded-r-full",
              !isActive && "group-hover:bg-zinc-700",
            )}>
            {isActive ? (
              <CurrentFill slim={slim} />
            ) : (
              <Fill
                percent={getExerciseFill(exercise, exerciseTimes[idx] ?? 0, completedExercises.includes(idx))}
                slim={slim}
              />
            )}
          </div>
        );

        if (!onExerciseSelect || isSingle) {
          return <div key={idx} className='flex-1'>{bar}</div>;
        }
        return (
          <button
            key={idx}
            type='button'
            onClick={() => onExerciseSelect(idx)}
            className='group relative flex h-full flex-1 items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
            aria-current={isActive ? "step" : undefined}
            aria-label={t("progress.go_to", { label: title })}>
            {bar}
            <span
              translate={exercise.songData ? "no" : undefined}
              className='tooltip-ink pointer-events-none absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-white px-2 py-1 text-xs font-semibold text-black opacity-0 transition-opacity group-hover:opacity-100'>
              {title}
            </span>
          </button>
        );
      })}
    </div>
  );
});
