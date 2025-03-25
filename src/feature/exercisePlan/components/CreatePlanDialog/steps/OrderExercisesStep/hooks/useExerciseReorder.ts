import type { DropResult } from "@hello-pangea/dnd";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { useCallback } from "react";

interface UseExerciseReorderProps {
  exercises: Exercise[];
  onExercisesReorder: (exercises: Exercise[]) => void;
}

interface UseExerciseReorderReturn {
  handleDragEnd: (result: DropResult) => void;
  handleMoveUp: (index: number) => void;
  handleMoveDown: (index: number) => void;
}

export const useExerciseReorder = ({
  exercises,
  onExercisesReorder,
}: UseExerciseReorderProps): UseExerciseReorderReturn => {
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      const items = Array.from(exercises);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      onExercisesReorder(items);
    },
    [exercises, onExercisesReorder]
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index === 0) return; 

      const items = Array.from(exercises);
      [items[index], items[index - 1]] = [items[index - 1], items[index]];

      onExercisesReorder(items);
    },
    [exercises, onExercisesReorder]
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index === exercises.length - 1) return; 

      const items = Array.from(exercises);
      [items[index], items[index + 1]] = [items[index + 1], items[index]];

      onExercisesReorder(items);
    },
    [exercises, onExercisesReorder]
  );

  return {
    handleDragEnd,
    handleMoveUp,
    handleMoveDown,
  };
}; 