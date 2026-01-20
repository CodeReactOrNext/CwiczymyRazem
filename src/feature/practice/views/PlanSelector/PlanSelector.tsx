import MainContainer from "components/MainContainer";
import { PageHeader } from "constants/PageHeader";
import { PlanCard } from "feature/exercisePlan/components/PlanCard";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { getUserExercisePlans } from "feature/exercisePlan/services/getUserExercisePlans";
import type { ExercisePlan, LocalizedContent } from "feature/exercisePlan/types/exercise.types";
import { selectUserAuth } from "feature/user/store/userSlice";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "store/hooks";

interface PlanSelectorProps {
  onBack: () => void;
  onSelectPlan?: (planId: string) => void;
  loadingPlanId?: string | null;
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export const PlanSelector = ({ onBack, onSelectPlan, loadingPlanId }: PlanSelectorProps) => {
  const { t, i18n } = useTranslation(["exercises", "common"]);
  const currentLang = i18n.language as keyof LocalizedContent;
  const userAuth = useAppSelector(selectUserAuth);
  
  const [customPlans, setCustomPlans] = useState<ExercisePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCustomPlans = async () => {
      if (!userAuth) {
        setIsLoading(false);
        return;
      }
      
      try {
        const plans = await getUserExercisePlans(userAuth);
        setCustomPlans(plans);
      } catch (error) {
        console.error("Failed to load custom plans:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomPlans();
  }, [userAuth]);

  const handleStartPlan = (planId: string) => {
    const plan = [...defaultPlans, ...customPlans].find((p) => p.id === planId);
    if (plan && onSelectPlan) {
      onSelectPlan(planId);
    }
  };

  const allPlans = [...defaultPlans, ...customPlans];

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

        {isLoading ? (
          <div className='flex h-[400px] items-center justify-center'>
            <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-500' />
          </div>
        ) : (
          <>
            {customPlans.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-zinc-100">
                  {t("exercises:my_plans.custom_plans")}
                </h2>
                <motion.div
                  variants={item}
                  className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                  {customPlans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      onSelect={() => handleStartPlan(plan.id)}
                      onStart={() => handleStartPlan(plan.id)}
                      startButtonText={t("common:start")}
                      isLoading={loadingPlanId === plan.id}
                    />
                  ))}
                </motion.div>
              </div>
            )}

            <div className="space-y-12">
              {(customPlans.length > 0) && (
                <h2 className="text-xl font-semibold text-zinc-100">
                  {t("exercises:my_plans.predefined_plans")}
                </h2>
              )}
              
              {(["easy", "medium", "hard"] as const).map((difficulty) => {
                const plans = defaultPlans.filter((p) => p.difficulty === difficulty);
                if (plans.length === 0) return null;

                const difficultyColors = {
                  easy: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
                  medium: "text-amber-400 border-amber-500/20 bg-amber-500/5",
                  hard: "text-red-400 border-red-500/20 bg-red-500/5",
                };

                return (
                  <div key={difficulty} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest ${difficultyColors[difficulty]}`}>
                         {t(`exercises:difficulty.${difficulty}`)}
                      </div>
                      <div className="h-px flex-1 bg-gradient-to-r from-zinc-800 to-transparent" />
                    </div>
                    
                    <motion.div
                      variants={item}
                      className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                      {plans.map((plan) => (
                        <PlanCard
                          key={plan.id}
                          plan={plan}
                          onSelect={() => handleStartPlan(plan.id)}
                          onStart={() => handleStartPlan(plan.id)}
                          startButtonText={t("common:start")}
                          isLoading={loadingPlanId === plan.id}
                        />
                      ))}
                    </motion.div>
                  </div>
                );
              })}
            </div>

          </>
        )}
      </motion.div>
    </MainContainer>
  );
};
