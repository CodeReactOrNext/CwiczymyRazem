import type { DraggableProvided } from "@hello-pangea/dnd";
import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { useTranslation } from "react-i18next";
import {
  FaArrowDown,
  FaArrowUp,
  FaClock,
  FaGripVertical,
} from "react-icons/fa";

interface ExerciseItemProps {
  exercise: Exercise;
  provided: DraggableProvided;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export const ExerciseItem = ({
  exercise,
  provided,
  index,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: ExerciseItemProps) => {
  const { t } = useTranslation(["exercises", "common"]);
  /* Removed currentLang logic */

  const handleMoveUp = () => onMoveUp(index);
  const handleMoveDown = () => onMoveDown(index);

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      className='rounded-lg border bg-card p-4'>
      <div className='flex items-center gap-4'>
        <div
          {...provided.dragHandleProps}
          className='hidden text-muted-foreground md:block'>
          <FaGripVertical />
        </div>

        <div className='flex flex-col gap-6 text-muted-foreground md:hidden'>
          <Button
            variant='ghost'
            size='icon'
            className='h-6 w-6 p-1'
            onClick={handleMoveUp}
            disabled={isFirst}
            aria-label='Move exercise up'>
            <FaArrowUp />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-6 w-6 p-1'
            onClick={handleMoveDown}
            disabled={isLast}
            aria-label='Move exercise down'>
            <FaArrowDown />
          </Button>
        </div>

        <div className='flex-1'>
          <div className='flex flex-col items-start justify-between gap-2 md:flex-row md:items-center'>
            <h3 className='font-medium'>{exercise.title}</h3>
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                <FaClock className='h-3 w-3' />
                <span>{exercise.timeInMinutes} min</span>
              </div>
              <Badge variant='secondary'>
                {t(`exercises:categories.${exercise.category}` as any)}
              </Badge>
            </div>
          </div>
          <p className='mt-4 text-sm text-muted-foreground md:mt-1'>
            {exercise.description}
          </p>
        </div>
      </div>
    </div>
  );
};
