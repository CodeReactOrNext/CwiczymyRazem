import { Button } from "assets/components/ui/button";
import { useExerciseReorder } from "feature/exercisePlan/components/CreatePlanDialog/steps/OrderExercisesStep/hooks/useExerciseReorder";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { ExerciseList } from "./components/ExerciseList";

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
  const { t } = useTranslation(["exercises", "common"]);

  const { handleDragEnd, handleMoveUp, handleMoveDown } = useExerciseReorder({
    exercises: selectedExercises,
    onExercisesReorder,
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className='space-y-6'>
      <div className='flex flex-col items-start justify-between gap-2 md:flex-row md:items-center'>
        <div>
          <h2 className='text-2xl font-bold'>
            {t("exercises:my_plans.create_dialog.order_exercises")}
          </h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            {t("exercises:my_plans.create_dialog.order_description")}
          </p>
        </div>
      </div>

      <ExerciseList
        exercises={selectedExercises}
        onDragEnd={handleDragEnd}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
      />

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
