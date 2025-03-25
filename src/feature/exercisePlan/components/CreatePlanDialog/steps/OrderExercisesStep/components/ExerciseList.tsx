import type { DropResult } from "@hello-pangea/dnd";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import { ExerciseItem } from "./ExerciseItem";

interface ExerciseListProps {
  exercises: Exercise[];
  onDragEnd: (result: DropResult) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export const ExerciseList = ({
  exercises,
  onDragEnd,
  onMoveUp,
  onMoveDown,
}: ExerciseListProps) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId='exercises'>
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className='space-y-2'>
            {exercises.map((exercise, index) => (
              <Draggable
                key={exercise.id}
                draggableId={exercise.id}
                index={index}>
                {(provided) => (
                  <ExerciseItem
                    exercise={exercise}
                    provided={provided}
                    index={index}
                    isFirst={index === 0}
                    isLast={index === exercises.length - 1}
                    onMoveUp={onMoveUp}
                    onMoveDown={onMoveDown}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
