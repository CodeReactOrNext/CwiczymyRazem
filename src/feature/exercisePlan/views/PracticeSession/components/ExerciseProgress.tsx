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

  return (
    <Card className='overflow-hidden '>
      <div className='p-4'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between text-sm'>
            <Badge variant='outline'>
              {currentExerciseIndex + 1} z {plan.exercises.length}
            </Badge>
            <span className='text-muted-foreground'>
              {formattedTimeLeft} pozostało
            </span>
          </div>

          <div className='space-y-1'>
            <div className='relative h-2 w-full overflow-hidden rounded-full bg-muted/30'>
              {plan.exercises.map((exercise, idx) => {
                const width = (1 / plan.exercises.length) * 100;
                const left = (idx / plan.exercises.length) * 100;

                return (
                  <div
                    key={idx}
                    className={cn(
                      "absolute h-full transition-all duration-500",
                      idx < currentExerciseIndex
                        ? "bg-green-600/80"
                        : idx === currentExerciseIndex
                        ? "bg-primary"
                        : "bg-muted/20",
                      idx === currentExerciseIndex &&
                        "after:absolute after:inset-0 after:animate-pulse after:bg-primary/20"
                    )}
                  />
                );
              })}

              {plan.exercises.map(
                (_, idx) =>
                  idx < plan.exercises.length - 1 && (
                    <div
                      key={`separator-${idx}`}
                      className='absolute top-0 h-full w-px bg-background/50'
                      style={{
                        left: `${((idx + 1) / plan.exercises.length) * 100}%`,
                      }}
                    />
                  )
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
