import type {
  Exercise,
  ExercisePlan,
} from "feature/exercisePlan/types/exercise.types";

import { PlanDetailsForm } from "./components/PlanDetailsForm";

interface PlanDetailsStepProps {
  onSubmit: (data: Omit<ExercisePlan, "id">) => void;
  selectedExercises: Exercise[];
  initialData?: ExercisePlan;
}

export const PlanDetailsStep = ({
  onSubmit,
  selectedExercises,
  initialData,
}: PlanDetailsStepProps) => {
  return (
    <PlanDetailsForm
      onSubmit={onSubmit}
      selectedExercises={selectedExercises}
      initialData={initialData}
    />
  );
};
