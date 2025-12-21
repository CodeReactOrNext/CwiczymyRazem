import MainContainer from "components/MainContainer";
import { PageHeader } from "constants/PageHeader";
import { PlanCard } from "feature/exercisePlan/components/PlanCard";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import type { LocalizedContent } from "feature/exercisePlan/types/exercise.types";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

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
        <PageHeader
          title={t("exercises:plans.title")}
          description={t("exercises:plans.description")}
          onBack={onBack}
        />

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
