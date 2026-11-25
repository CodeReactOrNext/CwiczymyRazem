import { OrderExercisesStep } from "feature/exercisePlan/components/CreatePlanDialog/steps/OrderExercisesStep/OrderExercisesStep";
import { PlanDetailsStep } from "feature/exercisePlan/components/CreatePlanDialog/steps/PlanDetailsStep/PlanDetailsStep";
import { SelectExercisesStep } from "feature/exercisePlan/components/CreatePlanDialog/steps/SelectExercisesStep/SelectExercisesStep";
import { AnimatePresence } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
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
  const { t } = useTranslation("plans");
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
      {/* Where the builder is: one thick bar with the app's white glint, filled
          a step at a time, and the step in words beside it. */}
      <div className='mb-6 flex items-center gap-4'>
        <div
          role='progressbar'
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={currentIndex + 1}
          aria-label={t("create.step_of", { step: currentIndex + 1, total: STEPS.length })}
          className='relative h-4 flex-1 overflow-hidden rounded-full bg-zinc-800'>
          <div
            className='absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-[width] duration-slow'
            style={{ width: `${((currentIndex + 1) / STEPS.length) * 100}%` }}>
            <span className='light-hide absolute left-3 right-6 top-1 h-1 rounded-full bg-white/30' />
          </div>
        </div>
        <p className='shrink-0 text-[13px] font-semibold text-zinc-400'>
          <span className='tabular-nums text-zinc-500'>{t("create.step_of", { step: currentIndex + 1, total: STEPS.length })}</span>
          <span className='hidden sm:inline'>
            {" · "}
            {t(`create.steps.${STEPS[currentIndex].id}`, STEPS[currentIndex].label)}
          </span>
        </p>
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
