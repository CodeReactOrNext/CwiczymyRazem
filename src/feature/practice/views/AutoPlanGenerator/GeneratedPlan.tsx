import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import type {
  ExercisePlan,
  LocalizedContent,
} from "feature/exercisePlan/types/exercise.types";
import { useTranslation } from "hooks/useTranslation";
import { FaPlay } from "react-icons/fa";

import { ExerciseCard } from "./ExerciseCard";

interface GeneratedPlanProps {
  plan: ExercisePlan;
  onBack: () => void;
  onRegenerate: () => void;
  onStart: (plan: ExercisePlan) => void;
  onMoveExerciseUp: (index: number) => void;
  onMoveExerciseDown: (index: number) => void;
  onReplaceExercise: (index: number) => void;
  onRemoveExercise: (index: number) => void;
  isStarting?: boolean;
}

export const GeneratedPlan = ({
  plan,
  onBack,
  onRegenerate,
  onStart,
  onMoveExerciseUp,
  onMoveExerciseDown,
  onReplaceExercise,
  onRemoveExercise,
  isStarting
}: GeneratedPlanProps) => {
  const { t } = useTranslation(["exercises", "common"]);

  const getLocalizedText = (content: LocalizedContent | string): string => {
    return content;
  };

  return (
    <div className='mx-auto mt-3 max-w-3xl space-y-6 px-4 font-openSans'>
      <div className='mb-6 flex flex-col gap-4 sm:mb-10 sm:gap-6'>
        <h1 className='pt-2 text-2xl font-bold sm:pt-4 sm:text-3xl'>
          {t("exercises:auto_plan.generated_plan")}
        </h1>

        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' onClick={onBack} disabled={isStarting}>
            {t("common:back")}
          </Button>
          <Button variant='secondary' onClick={onRegenerate} disabled={isStarting}>
            Regenerate
          </Button>
          <Button
            onClick={() => onStart(plan)}
            className='ml-auto bg-primary hover:bg-primary/90'
            disabled={isStarting}
          >
            {isStarting ? (
                <div className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Loading...</span>
                </div>
            ) : (
                <>
                    <FaPlay className='mr-2 h-3.5 w-3.5' />
                    {t("common:start")}
                </>
            )}
          </Button>
        </div>
      </div>

      <Card className='p-4 sm:p-6'>
        <h2 className='mb-3 text-lg font-semibold sm:mb-4 sm:text-xl'>
          {getLocalizedText(plan.title)}
        </h2>
        <p className='mb-4 text-sm text-muted-foreground sm:mb-6'>
          {getLocalizedText(plan.description)}
        </p>

        <div className='space-y-3 sm:space-y-4'>
          {plan.exercises.map((exercise, index) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              index={index}
              generatedPlan={plan}
              onMoveUp={onMoveExerciseUp}
              onMoveDown={onMoveExerciseDown}
              onReplace={onReplaceExercise}
              onRemove={onRemoveExercise}
            />
          ))}
        </div>

        <div className='mt-6 pt-4 sm:mt-8'>
          <Button
            onClick={() => onStart(plan)}
            className='w-full shadow-md'
            size='lg'
            variant='default'
            disabled={isStarting}
          >
            {isStarting ? (
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Loading...</span>
                </div>
            ) : (
                <>
                    <FaPlay className='mr-2 h-4 w-4' />
                    {t("common:start")}
                </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};
