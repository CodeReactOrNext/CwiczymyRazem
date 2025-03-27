"use client";

import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { categoryGradients } from "feature/exercisePlan/constants/categoryStyles";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { useTranslation } from "react-i18next";
import { FaClock, FaDumbbell, FaGuitar, FaLightbulb } from "react-icons/fa";

import type { Exercise, LocalizedContent } from "../types/exercise.types";

interface ExtendedExercise extends Exercise {
  tab?: string[];
  tablature?: {
    bars: Array<{
      notes: Array<{
        string: number;
        fret: number | string;
      }>;
    }>;
  };
  imageUrl?: string;
}

interface ExerciseDetailsDialogProps {
  exercise: ExtendedExercise;
  isOpen: boolean;
  onClose: () => void;
  onStart?: () => void;
}

export const ExerciseDetailsDialog = ({
  exercise,
  isOpen,
  onClose,
  onStart,
}: ExerciseDetailsDialogProps) => {
  const { t: exerciseT, i18n } = useTranslation("exercises");
  const { t: commonT } = useTranslation("common");
  const currentLang = i18n.language as keyof LocalizedContent;

  const skills = exercise.relatedSkills
    .map((skillId) => guitarSkills.find((s) => s.id === skillId))
    .filter(Boolean);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      onStart?.();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-h-[70vh] overflow-y-auto p-0 sm:max-w-[650px]'>
        <div
          className={cn(
            "w-full rounded-t-lg bg-gradient-to-br p-6",
            categoryGradients[exercise.category]
          )}>
          <DialogHeader className='mb-4'>
            <DialogTitle className='text-2xl font-bold tracking-tight'>
              {exercise.title[currentLang]}
            </DialogTitle>
            <DialogDescription className='mt-2 text-base'>
              {exercise.description[currentLang]}
            </DialogDescription>
          </DialogHeader>

          <div className='mt-4 flex flex-wrap gap-4'>
            <Badge
              variant='secondary'
              className='flex items-center gap-2 px-3 py-1.5'>
              <FaClock className='h-3.5 w-3.5 text-muted-foreground' />
              <span>
                {exercise.timeInMinutes} {commonT("minutes")}
              </span>
            </Badge>
            <Badge
              variant='secondary'
              className='flex items-center gap-2 px-3 py-1.5'>
              <FaDumbbell className='h-3.5 w-3.5 text-muted-foreground' />
              <span>{exerciseT(`difficulty.${exercise.difficulty}`)}</span>
            </Badge>
            <Badge
              variant='secondary'
              className='flex items-center gap-2 px-3 py-1.5'>
              <FaGuitar className='h-3.5 w-3.5 text-muted-foreground' />
              <span>{exerciseT(`categories.${exercise.category}` as any)}</span>
            </Badge>
          </div>
        </div>

        <div className='space-y-6 p-6'>
          <div className='rounded-lg bg-muted/40 p-4'>
            <h4 className='mb-3 flex items-center gap-2 text-lg font-medium'>
              <FaGuitar className='h-4 w-4 text-primary' />
              {exerciseT("exercise.related_skills")}
            </h4>
            <div className='flex flex-wrap gap-2'>
              {skills.map(
                (skill) =>
                  skill && (
                    <Badge
                      key={skill.id}
                      variant='outline'
                      className='flex items-center gap-1 bg-background px-3 py-1'>
                      {skill.icon && <skill.icon className='h-3.5 w-3.5' />}
                      {commonT(`skills.${skill.id}` as any)}
                    </Badge>
                  )
              )}
            </div>
          </div>

          <div className='rounded-lg border p-4'>
            <h4 className='mb-3 flex items-center gap-2 text-lg font-medium'>
              <FaLightbulb className='h-4 w-4 text-amber-500' />
              {exerciseT("exercise.instructions")}
            </h4>
            <ul className='list-disc space-y-2 pl-5'>
              {exercise.instructions.map((instruction, index) => (
                <li key={index} className='text-foreground/90'>
                  {instruction[currentLang]}
                </li>
              ))}
            </ul>
          </div>

          <div className='rounded-lg border p-4'>
            <h4 className='mb-3 flex items-center gap-2 text-lg font-medium'>
              <FaLightbulb className='h-4 w-4 text-primary' />
              {exerciseT("exercise.tips")}
            </h4>
            <ul className='list-disc space-y-2 pl-5'>
              {exercise.tips.map((tip, index) => (
                <li key={index} className='text-foreground/90'>
                  {tip[currentLang]}
                </li>
              ))}
            </ul>
          </div>

          {exercise.imageUrl && (
            <div className='rounded-lg border p-4'>
              <h4 className='mb-3 flex items-center gap-2 text-lg font-medium'>
                {exerciseT("exercise.tab")}
              </h4>
              <div className='overflow-x-auto rounded-md bg-white p-2'>
                <img
                  src={exercise.imageUrl}
                  alt='Exercise tab'
                  className='h-auto max-w-full'
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className='gap-3 px-6 pb-6 pt-2'>
          <Button
            variant='outline'
            onClick={onClose}
            className='min-w-[100px]'
            tabIndex={0}
            aria-label={commonT("back")}
            onKeyDown={(e) => e.key === "Enter" && onClose()}>
            {commonT("back")}
          </Button>
          {onStart && (
            <Button
              onClick={onStart}
              className='min-w-[140px]'
              tabIndex={0}
              aria-label={exerciseT("exercise.create_dialog.start_practice")}
              onKeyDown={handleKeyDown}>
              {exerciseT("exercise.create_dialog.start_practice")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
