import { Badge } from "assets/components/ui/badge";
import { Card } from "assets/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";

import type {
  ExercisePlan,
  LocalizedContent,
} from "../../../types/exercise.types";

interface ExerciseProgressProps {
  plan: ExercisePlan;
  currentExerciseIndex: number;
  timeLeft: number;
  currentLang: keyof LocalizedContent;
  formattedTimeLeft: string;
}

const ExerciseProgress = ({
  plan,
  currentExerciseIndex,
  timeLeft,
  currentLang,
  formattedTimeLeft,
}: ExerciseProgressProps) => {
  const currentExercise = plan.exercises[currentExerciseIndex];

  return (
    <Card className='overflow-hidden bg-muted/5'>
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
                  <TooltipProvider key={idx}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "absolute h-full transition-all duration-500",
                            idx < currentExerciseIndex
                              ? "bg-primary/80" // Completed exercises
                              : idx === currentExerciseIndex
                              ? "bg-primary" // Active exercise
                              : "bg-muted/20", // Remaining exercises
                            idx === currentExerciseIndex &&
                              "after:absolute after:inset-0 after:animate-pulse after:bg-primary/20"
                          )}
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                            // For active exercise, show progress
                            ...(idx === currentExerciseIndex && {
                              clipPath: `inset(0 ${
                                100 -
                                (timeLeft /
                                  (currentExercise.timeInMinutes * 60)) *
                                  100
                              }% 0 0)`,
                            }),
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent
                        className='flex flex-col gap-1 p-3'
                        side='bottom'>
                        <div className='font-medium'>
                          {exercise.title[currentLang]}
                        </div>
                        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                          <Badge
                            variant='secondary'
                            className='h-5 px-1.5 text-xs'>
                            {idx + 1}/{plan.exercises.length}
                          </Badge>
                          <span>•</span>
                          <span>{exercise.timeInMinutes} min</span>
                          {idx < currentExerciseIndex && (
                            <>
                              <span>•</span>
                              <span className='text-green-600'>Ukończone</span>
                            </>
                          )}
                          {idx === currentExerciseIndex && (
                            <>
                              <span>•</span>
                              <span className='text-primary'>W trakcie</span>
                            </>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}

              {/* Separator between exercises */}
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

export default ExerciseProgress;
