import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import type {
  Exercise,
  ExercisePlan,
  LocalizedContent,
} from "feature/exercisePlan/types/exercise.types";
import { useTranslation } from "react-i18next";
import {
  FaArrowDown,
  FaArrowUp,
  FaClock,
  FaRandom,
  FaTrash,
  FaYoutube,
  FaVideo
} from "react-icons/fa";

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  generatedPlan: ExercisePlan | null;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onReplace: (index: number) => void;
  onRemove: (index: number) => void;
}

export const ExerciseCard = ({
  exercise,
  index,
  generatedPlan,
  onMoveUp,
  onMoveDown,
  onReplace,
  onRemove,
}: ExerciseCardProps) => {
  const { t } = useTranslation(["exercises", "common"]);
  /* Removed currentLang setup */

  const difficultyClasses = {
    easy: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    hard: "bg-red-100 text-red-800",
  };

  const getLocalizedText = (content: LocalizedContent | string): string => {
    if (typeof content === "string") return content;
    return content.en;
  };

  return (
    <Card className='relative cursor-pointer overflow-hidden border border-border/50 transition-all hover:border-primary/50'>
      <div className='p-3 sm:p-4'>
        <div className='mb-2 flex flex-wrap items-start justify-between gap-2'>
          <h3 className='text-base font-medium sm:text-lg'>
            {getLocalizedText(exercise.title)}
          </h3>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='whitespace-nowrap text-xs text-muted-foreground sm:text-sm'>
              <FaClock className='mr-1 inline h-3 w-3' />
              {exercise.timeInMinutes} {t("common:min")}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                difficultyClasses[
                  exercise.difficulty as keyof typeof difficultyClasses
                ]
              }`}>
              {exercise.difficulty}
            </span>
          </div>
        </div>

        <div className='mb-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm'>
          <span className='inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-800'>
            {exercise.category}
          </span>
          {exercise.isPlayalong && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">
               <FaYoutube className="h-2.5 w-2.5" />
               Playalong
            </span>
          )}
          {exercise.videoUrl && !exercise.isPlayalong && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 text-[10px] font-bold uppercase tracking-wider">
               <FaVideo className="h-2.5 w-2.5" />
               Video
            </span>
          )}
        </div>

        {exercise.description && (
          <p className='mt-2 text-xs text-muted-foreground sm:text-sm'>
            {getLocalizedText(exercise.description)}
          </p>
        )}

        <div className='mt-4 flex justify-between border-t border-border/30 pt-3'>
          <div className='flex space-x-2'>
            <Button
              variant='ghost'
              size='sm'
              className='h-8 px-2 text-muted-foreground hover:bg-muted'
              onClick={(e) => {
                e.stopPropagation();
                onReplace(index);
              }}>
              <FaRandom className='mr-1 h-3.5 w-3.5' />
              <span className='text-xs'>Losuj</span>
            </Button>

            <Button
              variant='ghost'
              size='sm'
              className='h-8 px-2 text-red-500 hover:bg-red-50 hover:text-red-600'
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}>
              <FaTrash className='mr-1 h-3.5 w-3.5' />
              <span className='text-xs'>Usuń</span>
            </Button>
          </div>

          <div className='flex space-x-1'>
            <Button
              variant='outline'
              size='sm'
              className='h-8 min-w-8 px-2'
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp(index);
              }}
              disabled={index === 0}>
              <FaArrowUp className='h-3.5 w-3.5' />
            </Button>

            <Button
              variant='outline'
              size='sm'
              className='h-8 min-w-8 px-2'
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown(index);
              }}
              disabled={
                !generatedPlan || index >= generatedPlan.exercises.length - 1
              }>
              <FaArrowDown className='h-3.5 w-3.5' />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
