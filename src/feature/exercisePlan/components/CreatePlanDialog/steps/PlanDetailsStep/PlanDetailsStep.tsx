import type {
  Exercise,
  ExercisePlan,
} from "feature/exercisePlan/types/exercise.types";

import { PlanDetailsForm } from "./components/PlanDetailsForm";

interface PlanDetailsStepProps {
  onSubmit: (data: Omit<ExercisePlan, "id">) => void;
  selectedExercises: Exercise[];
}

export const PlanDetailsStep = ({
  onSubmit,
  selectedExercises,
}: PlanDetailsStepProps) => {
  return (
    <PlanDetailsForm
      onSubmit={onSubmit}
      selectedExercises={selectedExercises}
    />
  );
};
