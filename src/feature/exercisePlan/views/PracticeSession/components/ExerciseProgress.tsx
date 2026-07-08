import { cn } from "assets/lib/utils";
import { memo } from "react";

import type { ExercisePlan } from "../../../types/exercise.types";

interface ExerciseProgressProps {
  plan: ExercisePlan;
  currentExerciseIndex: number;
  completedExercises: number[];
  onExerciseSelect: (index: number) => void;
}

export const ExerciseProgress = memo(function ExerciseProgress({
  plan,
  currentExerciseIndex,
  completedExercises,
  onExerciseSelect,
}: ExerciseProgressProps) {
  return (
    <div className='w-full max-w-none py-1 px-1'>
      <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Session Progress
          </span>
          <span className="text-[10px] font-semibold tabular-nums tracking-wide text-zinc-400">
            {currentExerciseIndex + 1} <span className="text-zinc-600">/</span> {plan.exercises.length}
          </span>
      </div>
      <div className='flex items-center w-full h-4'>
        {plan.exercises.map((_, idx) => {
          const isActive = idx === currentExerciseIndex;
          const isCompleted = completedExercises.includes(idx);

          return (
            <button
              key={idx}
              onClick={() => onExerciseSelect(idx)}
              className="group relative flex-1 h-full px-1 focus:outline-none transition-all"
              aria-label={`Go to exercise ${idx + 1}`}
            >
              {/* Background slot highlight on hover */}
              <div className="absolute inset-y-0 inset-x-1 rounded-md bg-white/0 group-hover:bg-white/5 transition-colors" />

              {/* The Visual Bar */}
              <div className={cn(
                "relative h-1.5 w-full rounded-full transition-all duration-300",
                isActive
                  ? "bg-cyan-500/90 shadow-[0_0_5px_rgba(34,211,238,0.3)]"
                  : isCompleted
                  ? "bg-emerald-500/70"
                  : "bg-zinc-800 group-hover:bg-zinc-700"
              )} />

              {/* Subtle hover tooltip showing exercise number */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-zinc-900 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Exercise {idx + 1}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});
