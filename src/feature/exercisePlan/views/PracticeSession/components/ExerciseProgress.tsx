import { Badge } from "assets/components/ui/badge";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";

import type { ExercisePlan } from "../../../types/exercise.types";

interface ExerciseProgressProps {
  plan: ExercisePlan;
  currentExerciseIndex: number;
  formattedTimeLeft: string;
}

export const ExerciseProgress = ({
  plan,
  currentExerciseIndex,
  formattedTimeLeft,
}: ExerciseProgressProps) => {
  const currentExercise = plan.exercises[currentExerciseIndex];
  const progressPercentage =
    ((currentExerciseIndex + 1) / plan.exercises.length) * 100;

  return (
    <Card className='radius-premium glass-card border-white/5'>
      <div className='p-4'>
        {/* Compact horizontal layout */}
        <div className='flex items-center gap-6'>
          {/* Progress info */}
          <div className='flex items-center gap-4'>
            <div>
              <h3 className='text-sm font-medium text-white'>
                Exercise {currentExerciseIndex + 1}/{plan.exercises.length}
              </h3>
              <p className='text-xs text-zinc-400'>
                {Math.round(progressPercentage)}% completed
              </p>
            </div>
          </div>

          {/* Progress bar - takes remaining space */}
          <div className='flex-1 space-y-2'>
            <div className='relative h-2 w-full overflow-hidden rounded-full bg-zinc-800'>
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
                        : "bg-zinc-700"
                    )}
                  />
                );
              })}
            </div>

            {/* Exercise dots below progress bar */}
            <div className='flex justify-between px-1'>
              {plan.exercises.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-1 w-1 rounded-full transition-all duration-300",
                    idx <= currentExerciseIndex ? "bg-white" : "bg-zinc-600"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Time info - compact */}
          <div className='text-right'>
            <div className='font-mono text-sm font-medium text-white'>
              {formattedTimeLeft}
            </div>
            <div className='text-xs text-zinc-400'>remaining</div>
          </div>
        </div>
      </div>
    </Card>
  );
};
