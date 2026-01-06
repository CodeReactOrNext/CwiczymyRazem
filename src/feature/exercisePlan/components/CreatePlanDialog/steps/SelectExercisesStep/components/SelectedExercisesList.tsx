import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { useTranslation } from "react-i18next";
import { FaClock, FaTimes } from "react-icons/fa";

interface SelectedExercisesListProps {
  selectedExercises: Exercise[];
  /* Removed currentLang */
  onToggleExercise: (exercise: Exercise) => void;
}

export const SelectedExercisesList = ({
  selectedExercises,
  /* Removed currentLang */
  onToggleExercise,
}: SelectedExercisesListProps) => {
  const { t } = useTranslation(["exercises"]);

  const totalDuration = selectedExercises.reduce(
    (total, exercise) => total + exercise.timeInMinutes,
    0
  );

  if (selectedExercises.length === 0) {
    return null;
  }

  const handleRemoveClick = (e: React.MouseEvent, exercise: Exercise) => {
    e.stopPropagation();
    onToggleExercise(exercise);
  };

  return (
    <div className='rounded-lg border border-border bg-muted/30 p-4'>
      <div className='flex flex-row items-center justify-between'>
        <h3 className='mb-3 text-sm font-medium text-muted-foreground'>
          {t("exercises:my_plans.create_dialog.selected_exercises", {
            count: selectedExercises.length,
          })}
        </h3>
        <div className='mb-2 flex w-fit min-w-4 items-center gap-1 rounded-md bg-muted/50 px-2 py-1 text-xs font-medium'>
          <FaClock className='h-3 w-3 text-primary' />
          <span>{totalDuration} min</span>
        </div>
      </div>
      <div className='flex flex-wrap gap-2'>
        {selectedExercises.map((exercise) => (
          <div
            key={exercise.id}
            className='group flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-sm'>
            <span className='max-w-[150px] truncate'>
              {exercise.title}
            </span>
            <div className='flex min-w-[60px] items-center gap-1 text-muted-foreground'>
              <FaClock className='h-3 w-3' />
              <span>{exercise.timeInMinutes} min</span>
            </div>
            <button
              onClick={(e) => handleRemoveClick(e, exercise)}
              className='text-muted-foreground hover:text-foreground'
              aria-label='Remove exercise'>
              <FaTimes className='h-3 w-3' />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
