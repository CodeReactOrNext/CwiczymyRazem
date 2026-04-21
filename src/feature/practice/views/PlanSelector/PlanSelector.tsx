import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import { PlanCard } from "feature/exercisePlan/components/PlanCard";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { getUserExercisePlans } from "feature/exercisePlan/services/getUserExercisePlans";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import { UpgradeModal } from "feature/premium/components/UpgradeModal";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { Flame, Music, Zap, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";

interface PlanSelectorProps {
  onBack?: () => void;
  onSelectPlan?: (planId: string) => void;
  loadingPlanId?: string | null;
}

export const PlanSelector = ({ onBack, onSelectPlan, loadingPlanId }: PlanSelectorProps) => {
  const { t } = useTranslation(["exercises", "common"]);
  const userAuth = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const isPremium = userInfo?.role === "pro" || userInfo?.role === "master" || userInfo?.role === "admin";

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
            {plans.map((plan) => {
              const locked = !!plan.premium && !isPremium;
              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isLocked={locked}
                  onSelect={locked ? undefined : () => handleStartPlan(plan.id)}
                  onStart={locked ? undefined : () => handleStartPlan(plan.id)}
                  onUpgrade={locked ? () => setShowUpgradeModal(true) : undefined}
                  startButtonText={t("common:start")}
                  isLoading={loadingPlanId === plan.id}
                />
              );
            })}
          </motion.div>
        </div>
      );
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='space-y-8 font-openSans px-3 md:px-6 lg:px-8 py-6 md:py-8'
      >

          {isLoading ? (
            <div className='flex h-[400px] items-center justify-center'>
              <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-500' />
            </div>
          ) : (
            <>
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4"
                >
                  <ArrowLeft size={16} />
                  <span className="text-sm font-medium">Back</span>
                </button>
              )}
              <Tabs defaultValue="routines" className="w-full">
              <TabsList className="bg-zinc-900 p-1 rounded-lg w-fit border border-white/5 h-auto">
                <TabsTrigger
                  value="routines"
                  className="gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 hover:text-zinc-300"
                >
                  <Music size={16} />
                  <span>Routines</span>
                </TabsTrigger>
                <TabsTrigger
                  value="playalongs"
                  className="gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 hover:text-zinc-300"
                >
                  <Zap size={16} />
                  <span>Playalongs</span>
                </TabsTrigger>
                <TabsTrigger
                  value="my_plans"
                  className="gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 hover:text-zinc-300"
                >
                  <Flame size={16} />
                  <span>My Plans</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="routines" className="mt-6 focus-visible:outline-none space-y-12">
                {renderDifficultyGroups(routinePlans)}
              </TabsContent>

              <TabsContent value="playalongs" className="mt-6 focus-visible:outline-none space-y-12">
            
                {renderDifficultyGroups(playalongPlans)}
              </TabsContent>

              <TabsContent value="my_plans" className="mt-6 focus-visible:outline-none space-y-12">

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
                    {customPlans.map((plan) => {
                      const locked = !!plan.premium && !isPremium;
                      return (
                        <PlanCard
                          key={plan.id}
                          plan={plan}
                          isLocked={locked}
                          onSelect={locked ? undefined : () => handleStartPlan(plan.id)}
                          onStart={locked ? undefined : () => handleStartPlan(plan.id)}
                          onUpgrade={locked ? () => setShowUpgradeModal(true) : undefined}
                          startButtonText={t("common:start")}
                          isLoading={loadingPlanId === plan.id}
                        />
                      );
                    })}
                  </motion.div>
                )}
              </TabsContent>
            </Tabs>
            </>
          )}
        </motion.div>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  );
};
