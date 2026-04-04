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
  initialPlan?: ExercisePlan;
  onSubmit: (
    title: string | LocalizedContent,
    description: string | LocalizedContent,
    exercises: Exercise[]
  ) => Promise<void>;
  onUpdate?: (plan: ExercisePlan) => Promise<void>;
}

export const CreatePlan = ({ initialPlan, onSubmit, onUpdate }: CreatePlanProps) => {
  const [step, setStep] = useState<Step>("select");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>(
    initialPlan?.exercises || []
  );

  const handleFinish = (planData: Omit<ExercisePlan, "id">) => {
    if (initialPlan && onUpdate) {
        onUpdate({ ...planData, id: initialPlan.id } as ExercisePlan);
    } else {
        onSubmit(planData.title, planData.description, selectedExercises);
    }
  };

  return (
    <div className='w-full'>
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
            onSubmit={handleFinish}
            onBack={() => setStep("order")}
            initialData={initialPlan}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
