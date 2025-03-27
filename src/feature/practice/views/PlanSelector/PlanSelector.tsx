import { Button } from "assets/components/ui/button";
import MainContainer from "components/MainContainer";
import { PlanCard } from "feature/exercisePlan/components/PlanCard";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import type { LocalizedContent } from "feature/exercisePlan/types/exercise.types";
import { motion } from "framer-motion";
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

  const handleStartPlan = (planId: string) => {
    const plan = defaultPlans.find((p) => p.id === planId);
    if (plan && onSelectPlan) {
      onSelectPlan(planId);
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
              onSelect={() => handleStartPlan(plan.id)}
              onStart={() => handleStartPlan(plan.id)}
              startButtonText={t("common:start")}
            />
          ))}
        </motion.div>
      </motion.div>
    </MainContainer>
  );
};
