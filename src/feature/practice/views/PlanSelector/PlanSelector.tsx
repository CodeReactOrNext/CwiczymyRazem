import { Button } from "assets/components/ui/button";
import MainContainer from "components/MainContainer";
import { ExerciseDetailsDialog } from "feature/exercisePlan/components/ExerciseDetailsDialog/ExerciseDetailsDialog";
import { PlanCard } from "feature/exercisePlan/components/PlanCard/PlanCard";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import type {
  Exercise,
  LocalizedContent,
} from "feature/exercisePlan/types/exercise.types";
import { motion } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa";

interface PlanSelectorProps {
  onBack: () => void;
  onSelectPlan?: (planId: string) => void;
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export const PlanSelector = ({ onBack, onSelectPlan }: PlanSelectorProps) => {
  const { t, i18n } = useTranslation(["exercises", "common"]);
  const currentLang = i18n.language as keyof LocalizedContent;
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );

  const handleStartPlan = (planId: string) => {
    const plan = defaultPlans.find((p) => p.id === planId);
    if (plan && onSelectPlan) {
      onSelectPlan(planId);
    }
  };

  const handleSelectPlan = (planId: string) => {
    const plan = defaultPlans.find((p) => p.id === planId);
    if (plan) {
      setSelectedExercise(plan.exercises[0]);
    }
  };

  const handleStartExercise = () => {
    if (selectedExercise) {
      const plan = defaultPlans.find((p) =>
        p.exercises.some((e) => e.id === selectedExercise.id)
      );
      if (plan && onSelectPlan) {
        onSelectPlan(plan.id);
      }
    }
  };

  return (
    <MainContainer>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='space-y-8 p-8 font-openSans'>
        <div className='flex items-center justify-between'>
          <div>
            <motion.h1
              variants={item}
              className='text-4xl font-bold tracking-tight'>
              {t("exercises:plans.title")}
            </motion.h1>
            <motion.p variants={item} className='mt-2 text-muted-foreground'>
              {t("exercises:plans.description")}
            </motion.p>
          </div>
          <Button variant='outline' onClick={onBack}>
            <FaArrowLeft className='mr-2 h-4 w-4' />
            {t("common:back")}
          </Button>
        </div>

        <motion.div
          variants={item}
          className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {defaultPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSelect={() => handleSelectPlan(plan.id)}
              onStart={() => handleStartPlan(plan.id)}
              startButtonText={t("common:start")}
            />
          ))}
        </motion.div>
      </motion.div>

      {selectedExercise && (
        <ExerciseDetailsDialog
          exercise={selectedExercise}
          isOpen={!!selectedExercise}
          onClose={() => setSelectedExercise(null)}
          onStart={handleStartExercise}
        />
      )}
    </MainContainer>
  );
};
