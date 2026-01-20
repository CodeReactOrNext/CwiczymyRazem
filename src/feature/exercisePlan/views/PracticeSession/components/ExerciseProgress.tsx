import { cn } from "assets/lib/utils";

import type { ExercisePlan } from "../../../types/exercise.types";

interface ExerciseProgressProps {
  plan: ExercisePlan;
  currentExerciseIndex: number;
  formattedTimeLeft: string;
  onExerciseSelect: (index: number) => void;
}

export const ExerciseProgress = ({
  plan,
  currentExerciseIndex,
  formattedTimeLeft,
  onExerciseSelect,
}: ExerciseProgressProps) => {
  const progressPercentage =
    ((currentExerciseIndex + 1) / plan.exercises.length) * 100;

  return (
    <div className='flex items-center gap-6 py-2 px-1 relative'>
      {/* Background line for overall feel */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/5" />

      {/* Progress info */}
      <div className='flex items-center gap-4 min-w-[120px]'>
        <div>
          <h3 className='text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]'>
            Exercise {currentExerciseIndex + 1}/{plan.exercises.length}
          </h3>
          <p className='text-[10px] text-zinc-600 font-bold'>
            {Math.round(progressPercentage)}% completed
          </p>
        </div>
      </div>

      {/* Progress bar - takes remaining space */}
      <div className='flex-1 space-y-1.5'>
        <div className='relative h-1 w-full overflow-hidden rounded-full bg-zinc-900/50'>
          {plan.exercises.map((exercise, idx) => {
            const width = (1 / plan.exercises.length) * 100;
            const left = (idx / plan.exercises.length) * 100;

            return (
              <div
                key={idx}
                style={{
                  width: `${width}%`,
                  left: `${left}%`,
                }}
                className={cn(
                  "absolute h-full transition-all duration-500",
                  idx < currentExerciseIndex
                    ? "bg-white"
                    : idx === currentExerciseIndex
                    ? "bg-white/70"
                    : "bg-zinc-800"
                )}
              />
            );
          })}
        </div>

        {/* Exercise dots below progress bar */}
        <div className='flex justify-between px-0.5'>
          {plan.exercises.map((_, idx) => (
            <button
              key={idx}
              onClick={() => onExerciseSelect(idx)}
              className={cn(
                "h-2 w-2 rounded-full transition-all duration-300 hover:scale-150 focus:outline-none focus:ring-2 focus:ring-cyan-500/50",
                idx <= currentExerciseIndex 
                  ? "bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.5)]" 
                  : "bg-zinc-800 hover:bg-zinc-700"
              )}
              aria-label={`Go to exercise ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Time info - compact */}
      <div className='text-right min-w-[80px]'>
        <div className='font-mono text-sm font-bold text-white'>
          {formattedTimeLeft}
        </div>
        <div className='text-[9px] text-zinc-600 uppercase tracking-wider font-bold'>remaining</div>
      </div>
    </div>
  );
};
