import { cn } from "assets/lib/utils";
import { useTranslation } from "react-i18next";
import { FaClock } from "react-icons/fa";

import type { Exercise } from "../../types/exercise.types";

interface ExerciseListItemProps {
  exercise: Exercise;
  isSelected: boolean;
  onClick: () => void;
}

export const ExerciseListItem = ({
  exercise,
  isSelected,
  onClick,
}: ExerciseListItemProps) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language as "pl" | "en";

  return (
    <div
      className={cn(
        "flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent",
        isSelected && "border-primary bg-primary/5"
      )}
      onClick={onClick}>
      <div>
        <h3 className='font-medium'>{exercise.title[currentLang]}</h3>
        <p className='text-sm text-muted-foreground'>
          {exercise.description[currentLang]}
        </p>
      </div>
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <FaClock className='h-4 w-4' />
        <span>{exercise.timeInMinutes} min</span>
      </div>
    </div>
  );
};
