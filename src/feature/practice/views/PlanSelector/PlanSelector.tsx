import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import MainContainer from "components/MainContainer";
import { PageHeader } from "constants/PageHeader";
import { PlanCard } from "feature/exercisePlan/components/PlanCard";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { getUserExercisePlans } from "feature/exercisePlan/services/getUserExercisePlans";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { selectUserAuth } from "feature/user/store/userSlice";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { Flame, Music, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";

interface PlanSelectorProps {
  onBack: () => void;
  onSelectPlan?: (planId: string) => void;
  loadingPlanId?: string | null;
}

export const PlanSelector = ({ onBack, onSelectPlan, loadingPlanId }: PlanSelectorProps) => {
  const { t } = useTranslation(["exercises", "common"]);
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

  const playalongPlans = defaultPlans.filter(p => p.exercises.some(e => e.isPlayalong));
  const routinePlans = defaultPlans.filter(p => !p.exercises.some(e => e.isPlayalong));

  const handleStartPlan = (planId: string) => {
    const plan = [...defaultPlans, ...customPlans].find((p) => p.id === planId);
    if (plan && onSelectPlan) {
      onSelectPlan(planId);
    }
  };

  const tabTriggerClass = "group flex-1 md:flex-none rounded-xl md:rounded-none data-[state=active]:bg-white md:data-[state=active]:bg-transparent data-[state=active]:after:hidden md:data-[state=active]:after:block data-[state=active]:text-black md:data-[state=active]:text-white text-zinc-400 md:text-zinc-500 font-bold uppercase tracking-widest text-[9px] md:text-[13px] py-2.5 md:py-5 px-3 md:px-1 transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 relative md:after:absolute md:after:bottom-0 md:after:left-0 md:after:right-0 md:after:h-0.5 md:after:bg-cyan-500 md:after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform";
  const tabIconClass = "md:w-5 md:h-5 group-data-[state=active]:text-black md:group-data-[state=active]:text-cyan-400 group-hover:text-white transition-colors";

  const renderDifficultyGroups = (sourcePlans: ExercisePlan[]) => {
    return (["easy", "medium", "hard"] as const).map((difficulty) => {
      const plans = sourcePlans.filter((p) => p.difficulty === difficulty);
      if (plans.length === 0) return null;

      const difficultyLabel = {
        easy: { color: "text-emerald-500" },
        medium: { color: "text-amber-500" },
        hard: { color: "text-red-500" },
      }[difficulty];

      return (
        <div key={difficulty} className="space-y-6">
          <div className="flex items-center gap-3">
            <div className={`h-1.5 w-1.5 rounded-full bg-current ${difficultyLabel.color}`} />
            <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${difficultyLabel.color}`}>
              {t(`common:difficulty.${difficulty}`)}
            </h3>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
          >
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
    });
  };

  return (
    <MainContainer>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='space-y-8 p-8 font-openSans'
      >
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
          <Tabs defaultValue="routines" className="w-full">
            <div className="mb-10 md:mb-12 sticky top-4 z-40 md:static">
              <TabsList className="bg-zinc-900/80 backdrop-blur-md border border-white/5 p-1 rounded-2xl h-auto md:bg-transparent md:border-none md:p-0 md:rounded-none md:justify-start md:space-x-12 md:w-full overflow-hidden shadow-2xl md:shadow-none w-full flex">
                <TabsTrigger value="routines" className={tabTriggerClass}>
                  <Music size={14} className={tabIconClass} />
                  <span>Routines</span>
                </TabsTrigger>
                <TabsTrigger value="playalongs" className={tabTriggerClass}>
                  <Zap size={14} className={tabIconClass} />
                  <span>Playalongs</span>
                </TabsTrigger>
                <TabsTrigger value="my_plans" className={tabTriggerClass}>
                  <Flame size={14} className={tabIconClass} />
                  <span>My Plans</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="routines" className="mt-0 focus-visible:outline-none space-y-12">
              <div className='mb-8 flex flex-col items-end text-right md:items-start md:text-left'>
                <h2 className='text-2xl font-bold text-white uppercase tracking-tight'>
                  Routine Library
                </h2>
                <p className='mt-1 text-xs text-zinc-500'>
                  Selection of curated routines for various techniques
                </p>
              </div>
              {renderDifficultyGroups(routinePlans)}
            </TabsContent>

            <TabsContent value="playalongs" className="mt-0 focus-visible:outline-none space-y-12">
              <div className='mb-8 flex flex-col items-end text-right md:items-start md:text-left'>
                <h2 className='text-2xl font-bold text-white uppercase tracking-tight'>
                  Playalong Library
                </h2>
                <p className='mt-1 text-xs text-zinc-500'>
                  Interactive video sessions to play along with
                </p>
              </div>
              {renderDifficultyGroups(playalongPlans)}
            </TabsContent>

            <TabsContent value="my_plans" className="mt-0 focus-visible:outline-none space-y-12">
              <div className='mb-8 flex flex-col items-end text-right md:items-start md:text-left'>
                <h2 className='text-2xl font-bold text-white uppercase tracking-tight'>
                  Your Custom Plans
                </h2>
                <p className='mt-1 text-xs text-zinc-500'>
                  {t("exercises:my_plans.custom_plans_description")}
                </p>
              </div>
              {customPlans.length === 0 ? (
                <div className='rounded-2xl border border-dashed border-white/5 p-12 text-center bg-zinc-900/10'>
                  <p className='text-zinc-500 text-sm'>
                    {t("exercises:my_plans.no_custom_plans")}
                  </p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
                >
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
              )}
            </TabsContent>
          </Tabs>
        )}
      </motion.div>
    </MainContainer>
  );
};
