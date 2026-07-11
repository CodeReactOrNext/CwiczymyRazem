import { cn } from "assets/lib/utils";
import { OrderExercisesStep } from "feature/exercisePlan/components/CreatePlanDialog/steps/OrderExercisesStep/OrderExercisesStep";
import { PlanDetailsStep } from "feature/exercisePlan/components/CreatePlanDialog/steps/PlanDetailsStep/PlanDetailsStep";
import { SelectExercisesStep } from "feature/exercisePlan/components/CreatePlanDialog/steps/SelectExercisesStep/SelectExercisesStep";
import { AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";

import type {
  Exercise,
  ExercisePlan,
  LocalizedContent,
} from "../../types/exercise.types";

type Step = "select" | "order" | "details";

const STEPS: { id: Step; label: string }[] = [
  { id: "select", label: "Select Exercises" },
  { id: "order", label: "Order" },
  { id: "details", label: "Details" },
];

interface CreatePlanProps {
  initialPlan?: ExercisePlan;
  onSubmit: (
    title: string | LocalizedContent,
    description: string | LocalizedContent,
    exercises: Exercise[],
    isPublic: boolean,
    appearance?: { icon?: string; color?: string }
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
        onSubmit(planData.title, planData.description, selectedExercises, planData.isPublic ?? false, {
          icon: planData.icon,
          color: planData.color,
        });
    }
  };

  const currentIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className='w-full'>
      <div className='mb-6 flex items-center gap-2' aria-label={`Step ${currentIndex + 1} of ${STEPS.length}`}>
        {STEPS.map((s, i) => (
          <div key={s.id} className='flex flex-1 items-center gap-2 last:flex-none'>
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                i < currentIndex
                  ? "bg-cyan-500 text-zinc-950"
                  : i === currentIndex
                  ? "bg-cyan-500/10 text-cyan-300"
                  : "bg-zinc-800/60 text-zinc-500"
              )}>
              {i < currentIndex ? <Check size={14} /> : i + 1}
            </div>
            <span
              className={cn(
                "hidden text-xs font-semibold sm:inline",
                i === currentIndex ? "text-white" : "text-zinc-500"
              )}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 rounded-full",
                  i < currentIndex ? "bg-cyan-500" : "bg-zinc-800"
                )}
              />
            )}
          </div>
        ))}
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
            onBack={() => setStep("order")}
            initialData={initialPlan}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
