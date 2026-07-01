import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import { PlanCard } from "feature/exercisePlan/components/PlanCard";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { getPublicExercisePlans } from "feature/exercisePlan/services/getPublicExercisePlans";
import { getUserExercisePlans } from "feature/exercisePlan/services/getUserExercisePlans";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { UpgradeModal } from "feature/premium/components/UpgradeModal";
import { selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import { toggleFavoritePlan } from "feature/user/store/userSlice.favoriteActions";
import { motion } from "framer-motion";
import { useRipple } from "hooks/useRipple";
import { useTranslation } from "hooks/useTranslation";
import { ArrowLeft, Flame, Globe, Heart, Music, Zap } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";

const PLAN_TABS = ["routines", "playalongs", "my_plans", "community"] as const;

const RippleTabsTrigger = ({
  value,
  icon,
  label,
  isActive,
}: {
  value: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}) => {
  const { createRipple, ripple } = useRipple();
  return (
    <TabsTrigger
      value={value}
      onClick={createRipple}
      className="relative shrink-0 gap-2 overflow-hidden px-4 py-2 rounded text-sm font-bold transition-background data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 hover:text-zinc-200"
    >
      {ripple}
      {icon}
      {/* On mobile only the active tab shows its label, so all four tabs stay
          visible at once; from sm up every label is shown. */}
      <span className={isActive ? "inline" : "hidden sm:inline"}>{label}</span>
    </TabsTrigger>
  );
};

interface PlanSelectorProps {
  onBack?: () => void;
  onSelectPlan?: (planId: string) => void;
  loadingPlanId?: string | null;
}

export const PlanSelector = ({ onBack, onSelectPlan, loadingPlanId }: PlanSelectorProps) => {
  const { t } = useTranslation(["exercises", "common"]);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const userAuth = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);
  const favoritePlanIds = userInfo?.favoritePlanIds ?? [];
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const isPremium = userInfo?.role === "pro" || userInfo?.role === "master" || userInfo?.role === "admin";

  const [activeTab, setActiveTab] = useState<(typeof PLAN_TABS)[number]>("routines");

  useEffect(() => {
    const queryTab = router.query.tab;
    if (typeof queryTab === "string" && (PLAN_TABS as readonly string[]).includes(queryTab)) {
      setActiveTab(queryTab as (typeof PLAN_TABS)[number]);
    }
  }, [router.query.tab]);

  const [customPlans, setCustomPlans] = useState<ExercisePlan[]>([]);
  const [communityPlans, setCommunityPlans] = useState<ExercisePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      if (!userAuth) {
        setIsLoading(false);
        return;
      }

      try {
        const [userPlans, publicPlans] = await Promise.all([
          getUserExercisePlans(userAuth),
          getPublicExercisePlans(),
        ]);
        setCustomPlans(userPlans);
        setCommunityPlans(publicPlans);
      } catch (error) {
        console.error("Failed to load plans:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlans();
  }, [userAuth]);

  const playalongPlans = defaultPlans.filter(p => p.exercises.some(e => e.isPlayalong));
  const routinePlans = defaultPlans.filter(p => !p.exercises.some(e => e.isPlayalong));

  const handleStartPlan = (planId: string) => {
    const plan = [...defaultPlans, ...customPlans, ...communityPlans].find((p) => p.id === planId);
    if (plan && onSelectPlan) {
      onSelectPlan(planId);
    }
  };

  const handleToggleFavorite = (planId: string) => {
    if (!userAuth) return;
    dispatch(toggleFavoritePlan({ planId, isFavorite: !favoritePlanIds.includes(planId) }));
  };

  const renderPlanCard = (plan: ExercisePlan) => {
    const locked = !!plan.premium && !isPremium;
    return (
      <PlanCard
        key={plan.id}
        plan={plan}
        isLocked={locked}
        onSelect={locked ? undefined : () => handleStartPlan(plan.id)}
        onStart={locked ? undefined : () => handleStartPlan(plan.id)}
        onUpgrade={locked ? () => setShowUpgradeModal(true) : undefined}
        onToggleFavorite={userAuth ? () => handleToggleFavorite(plan.id) : undefined}
        isFavorite={favoritePlanIds.includes(plan.id)}
        startButtonText={t("common:start")}
        isLoading={loadingPlanId === plan.id}
      />
    );
  };

  const renderDifficultyGroups = (sourcePlans: ExercisePlan[]) => {
    const favoritePlans = sourcePlans.filter((p) => favoritePlanIds.includes(p.id));

    return (
      <>
        {favoritePlans.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
              <h3 className="text-sm font-medium tracking-[0.2em] text-white">
                {t("common:favorites", "FAVORITES")}
              </h3>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
            >
              {favoritePlans.map(renderPlanCard)}
            </motion.div>
          </div>
        )}

        {(["beginner", "easy", "medium", "hard"] as const).map((difficulty) => {
          const plans = sourcePlans.filter(
            (p) => p.difficulty === difficulty && !favoritePlanIds.includes(p.id)
          );
          if (plans.length === 0) return null;

          const difficultyLabel = {
            beginner: { color: "text-sky-500" },
            easy: { color: "text-emerald-500" },
            medium: { color: "text-amber-500" },
            hard: { color: "text-red-500" },
          }[difficulty];

          return (
            <div key={difficulty} className="space-y-6">
              <div className="flex items-center gap-3">
                <div className={`h-1.5 w-1.5 rounded-full bg-current ${difficultyLabel.color}`} />
                <h3 className="text-sm font-medium tracking-[0.2em] text-white">
                  {t(`common:difficulty.${difficulty}`)}
                </h3>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
              >
                {plans.map(renderPlanCard)}
              </motion.div>
            </div>
          );
        })}
      </>
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='space-y-8 px-3 md:px-6 lg:px-8 py-6 md:py-8'
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
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as (typeof PLAN_TABS)[number])} className="w-full">
              <TabsList className="bg-zinc-900 p-1 rounded-lg h-auto max-w-full justify-start overflow-x-auto no-scrollbar">
                <RippleTabsTrigger value="routines" icon={<Music size={16} />} label="Routines" isActive={activeTab === "routines"} />
                <RippleTabsTrigger value="playalongs" icon={<Zap size={16} />} label="Playalongs" isActive={activeTab === "playalongs"} />
                <RippleTabsTrigger value="my_plans" icon={<Flame size={16} />} label="My Plans" isActive={activeTab === "my_plans"} />
                <RippleTabsTrigger value="community" icon={<Globe size={16} />} label="Community" isActive={activeTab === "community"} />
              </TabsList>

              <TabsContent value="routines" className="mt-6 focus-visible:outline-none space-y-12">
                {renderDifficultyGroups(routinePlans)}
              </TabsContent>

              <TabsContent value="playalongs" className="mt-6 focus-visible:outline-none space-y-12">
                {renderDifficultyGroups(playalongPlans)}
              </TabsContent>

              <TabsContent value="my_plans" className="mt-6 focus-visible:outline-none space-y-12">
                {customPlans.length === 0 ? (
                  <div className='rounded-lg p-12 text-center bg-zinc-900/30'>
                    <p className='text-zinc-400 text-sm'>
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

              <TabsContent value="community" className="mt-6 focus-visible:outline-none space-y-12">
                {communityPlans.length === 0 ? (
                  <div className='rounded-lg p-12 text-center bg-zinc-900/30'>
                    <p className='text-zinc-400 text-sm'>No community plans published yet.</p>
                    <p className='text-zinc-500 text-xs mt-2'>Go to My Plans and publish one of your plans to share it here.</p>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
                  >
                    {communityPlans.map((plan) => (
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
            </>
          )}
        </motion.div>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  );
};
