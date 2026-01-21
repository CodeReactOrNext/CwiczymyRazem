import { Badge } from "assets/components/ui/badge";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";

import { categoryColors } from "../constants/categoryStyles";
import type { Exercise } from "../types/exercise.types";

interface ExerciseDescriptionProps {
  exercise: Exercise;
}

export const ExerciseDescription = ({ exercise }: ExerciseDescriptionProps) => {
  const { t } = useTranslation("exercises");

  return (
    <div className='space-y-4 p-4'>
      <div className='flex items-center justify-between'>
        <Badge
          className={cn(
            "rounded-full px-3 py-1 text-xs",
            categoryColors[exercise.category]
          )}>
          {t(`categories.${exercise.category}` as any)}
        </Badge>
        <Badge variant='outline' className='rounded-full text-xs'>
          {t(`difficulty.${exercise.difficulty}`)}
        </Badge>
      </div>

      <div className='space-y-2 text-center'>
        <h2 className='text-2xl font-bold tracking-tight'>
          {exercise.title}
        </h2>
        <p className='text-sm text-muted-foreground'>
          {exercise.description}
        </p>
      </div>
    </div>
  );
};
