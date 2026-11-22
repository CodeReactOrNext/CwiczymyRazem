import { Chip } from "assets/components/ui/chip";
import { getCategoryChipColor } from "feature/exercisePlan/constants/categoryChip";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { useTranslation } from "hooks/useTranslation";

interface ExerciseDescriptionProps {
  exercise: Exercise;
}

export const ExerciseDescription = ({ exercise }: ExerciseDescriptionProps) => {
  const { t } = useTranslation("exercises");

  return (
    <div className='space-y-4 p-4'>
      <div className='flex items-center justify-between'>
        <Chip color={getCategoryChipColor(exercise.category)}>
          {t(`categories.${exercise.category}` as any)}
        </Chip>
        <Chip color='gray'>{t(`difficulty.${exercise.difficulty}`)}</Chip>
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
