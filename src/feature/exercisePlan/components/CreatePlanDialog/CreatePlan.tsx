import { OrderExercisesStep } from "feature/exercisePlan/components/CreatePlanDialog/steps/OrderExercisesStep/OrderExercisesStep";
import { PlanDetailsStep } from "feature/exercisePlan/components/CreatePlanDialog/steps/PlanDetailsStep/PlanDetailsStep";
import { SelectExercisesStep } from "feature/exercisePlan/components/CreatePlanDialog/steps/SelectExercisesStep/SelectExercisesStep";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";

import type {
  Exercise,
  ExercisePlan,
  LocalizedContent,
} from "../../types/exercise.types";

type Step = "select" | "order" | "details";

interface CreatePlanProps {
  onSubmit: (
    title: string | LocalizedContent,
    description: string | LocalizedContent,
    exercises: Exercise[]
  ) => Promise<void>;
}

export const CreatePlan = ({ onSubmit }: CreatePlanProps) => {
  const [step, setStep] = useState<Step>("select");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

  const handleCreatePlan = (planData: Omit<ExercisePlan, "id">) => {
    onSubmit(planData.title, planData.description, selectedExercises);
  };

  return (
    <div className='container mx-auto  py-8'>
      <AnimatePresence mode='wait'>
        {step === "select" && (
          <SelectExercisesStep
            selectedExercises={selectedExercises}
            onExercisesSelect={setSelectedExercises}
            onNext={() => setStep("order")}
          />
        )}

        {step === "order" && (
          <OrderExercisesStep
            selectedExercises={selectedExercises}
            onExercisesReorder={setSelectedExercises}
            onBack={() => setStep("select")}
            onNext={() => setStep("details")}
          />
        )}

        {step === "details" && (
          <PlanDetailsStep
            selectedExercises={selectedExercises}
            onSubmit={handleCreatePlan}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
