import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FaClock, FaGripVertical } from "react-icons/fa";

interface OrderExercisesStepProps {
  selectedExercises: Exercise[];
  onExercisesReorder: (exercises: Exercise[]) => void;
  onBack: () => void;
  onNext: () => void;
}

export const OrderExercisesStep = ({
  selectedExercises,
  onExercisesReorder,
  onBack,
  onNext,
}: OrderExercisesStepProps) => {
  const { t, i18n } = useTranslation(["exercises", "common"]);
  const currentLang = i18n.language as "pl" | "en";

  const totalDuration = useMemo(
    () =>
      selectedExercises.reduce(
        (total, exercise) => total + exercise.timeInMinutes,
        0
      ),
    [selectedExercises]
  );

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(selectedExercises);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onExercisesReorder(items);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>
            {t("exercises:my_plans.create_dialog.order_exercises")}
          </h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            {t("exercises:my_plans.create_dialog.order_description")}
          </p>
        </div>
        <div className='flex items-center gap-2 text-muted-foreground'>
          <FaClock className='h-4 w-4' />
          <span>{totalDuration} min</span>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId='exercises'>
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className='space-y-2'>
              {selectedExercises.map((exercise, index) => (
                <Draggable
                  key={exercise.id}
                  draggableId={exercise.id}
                  index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className='rounded-lg border bg-card p-4'>
                      <div className='flex items-center gap-4'>
                        <div
                          {...provided.dragHandleProps}
                          className='text-muted-foreground'>
                          <FaGripVertical />
                        </div>
                        <div className='flex-1'>
                          <div className='flex items-center justify-between'>
                            <h3 className='font-medium'>
                              {exercise.title[currentLang]}
                            </h3>
                            <div className='flex items-center gap-2'>
                              <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                                <FaClock className='h-3 w-3' />
                                <span>{exercise.timeInMinutes} min</span>
                              </div>
                              <Badge variant='secondary'>
                                {t(`exercises:categories.${exercise.category}`)}
                              </Badge>
                            </div>
                          </div>
                          <p className='mt-1 text-sm text-muted-foreground'>
                            {exercise.description[currentLang]}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className='flex gap-4'>
        <Button variant='outline' onClick={onBack}>
          {t("common:back")}
        </Button>
        <Button className='flex-1' onClick={onNext}>
          {t("common:next")}
        </Button>
      </div>
    </motion.div>
  );
};
