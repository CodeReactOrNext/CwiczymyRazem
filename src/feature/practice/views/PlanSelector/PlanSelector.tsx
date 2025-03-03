import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import MainContainer from "components/MainContainer";
import { ExerciseDetailsDialog } from "feature/exercisePlan/components/ExerciseDetailsDialog/ExerciseDetailsDialog";
import { categoryGradients } from "feature/exercisePlan/constants/categoryStyles";
import { defaultPlans } from "feature/exercisePlan/data/plans/defaultPlans";
import type {
  Exercise,
  LocalizedContent,
} from "feature/exercisePlan/types/exercise.types";
import { motion } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaClock } from "react-icons/fa";

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
            <Card
              key={plan.id}
              className='group relative cursor-pointer overflow-hidden border border-border/40 transition-all duration-300 hover:shadow-lg'
              onClick={() => setSelectedExercise(plan.exercises[0])}>
              <div
                className={`absolute inset-0 bg-gradient-to-br ${
                  categoryGradients[plan.category]
                } transition-all duration-300`}
              />

              <div className='relative z-10 p-6'>
                <div className='mb-4 flex items-center justify-between'>
                  <Badge variant='secondary'>
                    {t(`exercises:difficulty.${plan.difficulty}` as any)}
                  </Badge>
                  <div className='flex items-center text-sm text-muted-foreground'>
                    <FaClock className='mr-2 h-4 w-4' />
                    {plan.totalDuration} min
                  </div>
                </div>

                <h3 className='mb-2 text-xl font-semibold'>
                  {typeof plan.title === "string"
                    ? plan.title
                    : plan.title[currentLang] || plan.title.en}
                </h3>
                <p className='mb-4 text-sm text-muted-foreground'>
                  {typeof plan.description === "string"
                    ? plan.description
                    : plan.description[currentLang] || plan.description.en}
                </p>

                <div className='mt-4 flex items-center justify-between'>
                  <div className='text-sm text-muted-foreground'>
                    {t("exercises:plans.exercises_count", {
                      count: plan.exercises.length,
                    })}
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartPlan(plan.id);
                    }}>
                    {t("common:start")}
                  </Button>
                </div>
              </div>
            </Card>
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
