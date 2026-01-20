import { OrderExercisesStep } from "feature/exercisePlan/components/CreatePlanDialog/steps/OrderExercisesStep/OrderExercisesStep";
import { PlanDetailsStep } from "feature/exercisePlan/components/CreatePlanDialog/steps/PlanDetailsStep/PlanDetailsStep";
import { SelectExercisesStep } from "feature/exercisePlan/components/CreatePlanDialog/steps/SelectExercisesStep/SelectExercisesStep";
import { AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation(["exercises"]);
  const [step, setStep] = useState<Step>("select");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>(
    initialPlan?.exercises || []
  );

  const steps: { id: Step; label: string; number: number }[] = [
    { id: "select", label: t("exercises:plan.steps.exercises"), number: 1 },
    { id: "order", label: t("exercises:plan.steps.order"), number: 2 },
    { id: "details", label: t("exercises:plan.steps.details"), number: 3 },
  ];

  const handleFinish = (planData: Omit<ExercisePlan, "id">) => {
    if (initialPlan && onUpdate) {
        onUpdate({ ...planData, id: initialPlan.id } as ExercisePlan);
    } else {
        onSubmit(planData.title, planData.description, selectedExercises);
    }
  };

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className='container mx-auto py-8'>
      {/* Stepper */}
      <div className="mb-8 flex items-center justify-center">
        {steps.map((s, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = s.id === step;
          const isLast = index === steps.length - 1;

          return (
            <div key={s.id} className="flex items-center">
               <div className="flex flex-col items-center gap-2">
                  <div 
                    className={`
                      flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-300
                      ${isCompleted ? "border-cyan-500 bg-cyan-500 text-white" : ""}
                      ${isCurrent ? "border-cyan-500 bg-black text-cyan-500" : ""}
                      ${!isCompleted && !isCurrent ? "border-zinc-700 bg-zinc-900 text-zinc-500" : ""}
                    `}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <span>{s.number}</span>}
                  </div>
                  <span 
                    className={`
                      text-xs font-medium uppercase tracking-wider
                      ${isCurrent ? "text-cyan-400" : "text-zinc-500"}
                    `}
                  >
                    {s.label}
                  </span>
               </div>
               {!isLast && (
                 <div className={`mx-4 mb-6 h-[2px] w-12 sm:w-24 lg:w-32 ${index < currentStepIndex ? "bg-cyan-500" : "bg-zinc-800"}`} />
               )}
            </div>
          );
        })}
      </div>

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
            initialData={initialPlan}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
