import type {
  Exercise,
  ExercisePlan,
} from "feature/exercisePlan/types/exercise.types";

import { PlanDetailsForm } from "./components/PlanDetailsForm";

interface PlanDetailsStepProps {
  onSubmit: (data: Omit<ExercisePlan, "id">) => void;
  onBack: () => void;
  selectedExercises: Exercise[];
  initialData?: ExercisePlan;
}

export const PlanDetailsStep = ({
  onSubmit,
  onBack,
  selectedExercises,
  initialData,
}: PlanDetailsStepProps) => {
  return (
    <PlanDetailsForm
      onSubmit={onSubmit}
      onBack={onBack}
      selectedExercises={selectedExercises}
      initialData={initialData}
    />
  );
};
