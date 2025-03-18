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
import { Separator } from "assets/components/ui/separator";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { useTranslation } from "react-i18next";
import { FaClock, FaDumbbell } from "react-icons/fa";

import type { Exercise, LocalizedContent } from "../../types/exercise.types";

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>{exercise.title[currentLang]}</DialogTitle>
          <DialogDescription>
            {exercise.description[currentLang]}
          </DialogDescription>
        </DialogHeader>

        <div className='mt-4 space-y-6'>
          {/* Basic Info */}
          <div className='flex flex-wrap gap-4'>
            <div className='flex items-center gap-2'>
              <FaClock className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>
                {exercise.timeInMinutes} {commonT("minutes")}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <FaDumbbell className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>
                {exerciseT(`difficulty.${exercise.difficulty}`)}
              </span>
            </div>
          </div>

          <Separator />

          {/* Skills */}
          <div>
            <h4 className='mb-2 font-medium'>
              {exerciseT("exercise.related_skills")}
            </h4>
            <div className='flex flex-wrap gap-2'>
              {skills.map(
                (skill) =>
                  skill && (
                    <Badge
                      key={skill.id}
                      variant='secondary'
                      className='flex items-center gap-1'>
                      {skill.icon && <skill.icon className='h-3 w-3' />}
                      {commonT(`skills.${skill.id}` as any)}
                    </Badge>
                  )
              )}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h4 className='mb-2 font-medium'>
              {exerciseT("exercise.instructions")}
            </h4>
            <ul className='list-disc space-y-2 pl-5'>
              {exercise.instructions.map((instruction, index) => (
                <li key={index}>{instruction[currentLang]}</li>
              ))}
            </ul>
          </div>

          {/* Tips */}
          <div>
            <h4 className='mb-2 font-medium'>{exerciseT("exercise.tips")}</h4>
            <ul className='list-disc space-y-2 pl-5'>
              {exercise.tips.map((tip, index) => (
                <li key={index}>{tip[currentLang]}</li>
              ))}
            </ul>
          </div>

          {exercise.imageUrl && (
            <div>
              <h4 className='mb-2 font-medium'>{exerciseT("exercise.tab")}</h4>
              <div className='overflow-x-auto rounded-md border bg-white p-4'>
                <img
                  src={exercise.imageUrl}
                  alt='Exercise tab'
                  className='h-auto max-w-full'
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className='mt-6'>
          <Button variant='outline' onClick={onClose}>
            {commonT("back")}
          </Button>
          {onStart && (
            <Button onClick={onStart}>
              {exerciseT("exercise.create_dialog.start_practice")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
