import type { DraggableProvided } from "@hello-pangea/dnd";
import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { SONG_PRACTICE_MODE_LABELS } from "feature/exercisePlan/utils/songToExercise";
import { useTranslation } from "hooks/useTranslation";
import { Music } from "lucide-react";
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
  const isSong = !!exercise.songData;

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      className={cn("rounded-lg p-4", isSong ? "bg-amber-500/[0.06]" : "bg-zinc-900/40")}>
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

        {isSong &&
          (exercise.songData?.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={exercise.songData.coverUrl}
              alt=''
              className='h-10 w-10 shrink-0 rounded object-cover'
            />
          ) : (
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded bg-zinc-800 text-zinc-500'>
              <Music className='h-4 w-4' />
            </div>
          ))}

        <div className='flex-1'>
          <div className='flex flex-col items-start justify-between gap-2 md:flex-row md:items-center'>
            <h3 className='font-medium' translate={isSong ? 'no' : undefined}>
              {isSong ? exercise.songData?.title : exercise.title}
            </h3>
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                <FaClock className='h-3 w-3' />
                <span>{exercise.timeInMinutes} min</span>
              </div>
              {isSong ? (
                <Badge className='border-transparent bg-amber-500/10 text-amber-300 hover:bg-amber-500/15'>
                  Song
                  {exercise.songData?.mode && ` · ${SONG_PRACTICE_MODE_LABELS[exercise.songData.mode]}`}
                </Badge>
              ) : (
                <Badge variant='secondary'>
                  {t(`exercises:categories.${exercise.category}` as any)}
                </Badge>
              )}
            </div>
          </div>
          <p className='mt-4 text-sm text-muted-foreground md:mt-1'>
            {isSong ? exercise.songData?.artist : exercise.description}
          </p>
        </div>
      </div>
    </div>
  );
};
