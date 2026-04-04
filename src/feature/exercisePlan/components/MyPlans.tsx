// eslint-disable-next-line simple-import-sort/imports
import React from "react";
import { Button } from "assets/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import { ExerciseLayout } from "feature/exercisePlan/components/ExerciseLayout";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { useTranslation } from "hooks/useTranslation";
import { FaPlus } from "react-icons/fa";
import { BookOpen, Flame, Music, Zap } from "lucide-react";

import { UpgradeModal } from "feature/premium/components/UpgradeModal";
import { selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import { useRouter } from "next/router";

import { toast } from "sonner";
import { getUserExercisePlans } from "../services/getUserExercisePlans";
import type {
  Exercise,
  ExercisePlan,
} from "../types/exercise.types";
import { PlanCard } from "./PlanCard";
import { CreatePlan } from "./CreatePlanDialog/CreatePlan";
import { createExercisePlan } from "feature/exercisePlan/services/createExercisePlan";
import { updateExercisePlan } from "feature/exercisePlan/services/updateExercisePlan";
import { deleteExercisePlan } from "feature/exercisePlan/services/deleteExercisePlan";
import { logger } from "feature/logger/Logger";
import { determinePlanDifficulty } from "feature/exercisePlan/utils/determinePlanDifficulty";
import { determinePlanCategory } from "feature/exercisePlan/utils/deteminePlanCategory";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

const SectionHeader = ({ title, subtitle, action }: SectionHeaderProps) => (
  <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-3">
      <div className="h-8 w-[3px] rounded-full bg-gradient-to-b from-cyan-400 to-cyan-400/0" />
      <div>
        <h2 className="text-base font-black uppercase tracking-widest text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[11px] text-zinc-500">{subtitle}</p>}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

interface MyPlansProps {
  onPlanSelect: (plan: ExercisePlan) => void;
  hideTabs?: Array<"routines" | "playalongs" | "my_plans">;
  hideLayout?: boolean;
  controlledTab?: string;
  onTabChange?: (tab: string) => void;
  hideSectionHeader?: boolean;
}

export const MyPlans = ({ onPlanSelect, hideTabs = [], hideLayout, controlledTab, onTabChange, hideSectionHeader }: MyPlansProps) => {
  const { t } = useTranslation(["exercises", "common"]);
  const [plans, setPlans] = useState<ExercisePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<ExercisePlan | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const userAuth = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);
  const isPremium = userInfo?.role === "pro" || userInfo?.role === "master" || userInfo?.role === "admin";
  const router = useRouter();
  const [internalTab, setInternalTab] = useState(
    hideTabs.includes("routines") ? "my_plans" : "routines"
  );
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (tab: string) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  useEffect(() => {
    const loadPlans = async () => {
      if (!userAuth) return;
      setIsLoading(true);
      const userPlans = await getUserExercisePlans(userAuth);
      setPlans(userPlans);
      setIsLoading(false);
    };

    loadPlans();
  }, [userAuth]);

  // Filter playalongs from routines
  const playalongPlans = defaultPlans.filter(p => p.exercises.some(e => e.isPlayalong));
  const routinePlans = defaultPlans.filter(p => !p.exercises.some(e => e.isPlayalong));

  const handleCreatePlan = async (
    title: string,
    description: string,
    exercises: Exercise[]
  ): Promise<void> => {
    try {
      if (!userAuth) {
        logger.error("User not authenticated", {
          context: "handleCreatePlan",
        });

        return;
      }

      const formattedPlanData = {
        title,
        description,
        category: determinePlanCategory(exercises),
        difficulty: determinePlanDifficulty(exercises),
        exercises,
        userId: userAuth,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
      };

      const planId = await createExercisePlan(userAuth, formattedPlanData);

      const newPlan: ExercisePlan = {
        ...formattedPlanData,
        id: planId,
      };

      setPlans((prevPlans) => [...prevPlans, newPlan]);

      toast.success(t("exercises:my_plans.create_success") as string);
    } catch (error) {
      logger.error(error, { context: "handleCreatePlan" });
      toast.error(t("exercises:my_plans.create_error") as string);
    }
  };

  const handleUpdatePlan = async (updatedPlan: ExercisePlan): Promise<void> => {
    try {
      await updateExercisePlan(updatedPlan.id, {
        title: updatedPlan.title,
        description: updatedPlan.description,
        exercises: updatedPlan.exercises,
        category: updatedPlan.category,
        difficulty: updatedPlan.difficulty,
      });

      setPlans((prevPlans) =>
        prevPlans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
      );
      setEditingPlan(null);
      toast.success(t("common:success") as string);
    } catch (error) {
      logger.error(error, { context: "handleUpdatePlan" });
      toast.error(t("common:error") as string);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!window.confirm(t("common:confirm_delete") as string)) return;

    try {
      await deleteExercisePlan(planId);
      setPlans((prevPlans) => prevPlans.filter((p) => p.id !== planId));
      toast.success(t("common:success") as string);
    } catch (error) {
      logger.error(error, { context: "handleDeletePlan" });
      toast.error(t("common:error") as string);
    }
  };

  if (isLoading) {
    return (
      <div className='flex h-[400px] items-center justify-center'>
        <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-primary' />
      </div>
    );
  }

  if (editingPlan) {
    return (
      <div className='container mx-auto px-4 lg:px-8 py-8 md:py-12'>
        <div className='mb-4 px-4'>
          <Button variant='ghost' onClick={() => setEditingPlan(null)}>
            {t("common:back")}
          </Button>
        </div>
        <CreatePlan initialPlan={editingPlan} onSubmit={handleCreatePlan} onUpdate={handleUpdatePlan} />
      </div>
    );
  }

  const renderDifficultyGroups = (sourcePlans: ExercisePlan[]) => {
    return (["easy", "medium", "hard"] as const).map((difficulty) => {
      const difficultyPlans = sourcePlans.filter((p) => p.difficulty === difficulty);
      if (difficultyPlans.length === 0) return null;

      const difficultyLabel = {
        easy: { color: "text-emerald-500" },
        medium: { color: "text-amber-500" },
        hard: { color: "text-red-500" }
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
          
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {difficultyPlans.map((plan) => {
              const locked = !!plan.premium && !isPremium;
              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isLocked={locked}
                  onSelect={locked ? undefined : () => onPlanSelect(plan)}
                  onStart={locked ? undefined : () => onPlanSelect(plan)}
                  onUpgrade={locked ? () => setShowUpgradeModal(true) : undefined}
                />
              );
            })}
          </div>
        </div>
      );
    });
  };

  const content = (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Navigation Switcher */}
        {!controlledTab && (["routines", "playalongs", "my_plans"] as const).filter(t => !hideTabs.includes(t)).length > 1 && <div className="mb-10 md:mb-12 sticky top-4 z-40 md:static">
          <TabsList className="bg-zinc-900/80 backdrop-blur-md border border-white/5 p-1 rounded-2xl h-auto md:bg-transparent md:border-none md:p-0 md:rounded-none md:justify-start md:space-x-12 md:w-full overflow-hidden shadow-2xl md:shadow-none w-full flex">
            {!hideTabs.includes("routines") && (
              <TabsTrigger
                value="routines"
                className="group flex-1 md:flex-none rounded-xl md:rounded-none data-[state=active]:bg-white md:data-[state=active]:bg-transparent data-[state=active]:after:hidden md:data-[state=active]:after:block data-[state=active]:text-black md:data-[state=active]:text-white text-zinc-400 md:text-zinc-500 font-bold uppercase tracking-widest text-[9px] md:text-[13px] py-2.5 md:py-5 px-3 md:px-1 transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 relative md:after:absolute md:after:bottom-0 md:after:left-0 md:after:right-0 md:after:h-0.5 md:after:bg-cyan-500 md:after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform"
              >
                <Music size={14} className="md:w-5 md:h-5 group-data-[state=active]:text-black md:group-data-[state=active]:text-cyan-400 group-hover:text-white transition-colors" />
                <span>Routines</span>
              </TabsTrigger>
            )}
            {!hideTabs.includes("playalongs") && (
              <TabsTrigger
                value="playalongs"
                className="group flex-1 md:flex-none rounded-xl md:rounded-none data-[state=active]:bg-white md:data-[state=active]:bg-transparent data-[state=active]:after:hidden md:data-[state=active]:after:block data-[state=active]:text-black md:data-[state=active]:text-white text-zinc-400 md:text-zinc-500 font-bold uppercase tracking-widest text-[9px] md:text-[12px] py-2.5 md:py-5 px-3 md:px-1 transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 relative md:after:absolute md:after:bottom-0 md:after:left-0 md:after:right-0 md:after:h-0.5 md:after:bg-cyan-500 md:after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform"
              >
                <Zap size={14} className="md:w-5 md:h-5 group-data-[state=active]:text-black md:group-data-[state=active]:text-cyan-400 group-hover:text-white transition-colors" />
                <span>Playalongs</span>
              </TabsTrigger>
            )}
            {!hideTabs.includes("my_plans") && (
              <TabsTrigger
                value="my_plans"
                className="group flex-1 md:flex-none rounded-xl md:rounded-none data-[state=active]:bg-white md:data-[state=active]:bg-transparent data-[state=active]:after:hidden md:data-[state=active]:after:block data-[state=active]:text-black md:data-[state=active]:text-white text-zinc-400 md:text-zinc-500 font-bold uppercase tracking-widest text-[9px] md:text-[12px] py-2.5 md:py-5 px-3 md:px-1 transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 relative md:after:absolute md:after:bottom-0 md:after:left-0 md:after:right-0 md:after:h-0.5 md:after:bg-cyan-500 md:after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform"
              >
                <Flame size={14} className="md:w-5 md:h-5 group-data-[state=active]:text-black md:group-data-[state=active]:text-cyan-400 group-hover:text-white transition-colors" />
                <span>My Plans</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>}

        <TabsContent value="routines" className="mt-0 focus-visible:outline-none space-y-12">
          {renderDifficultyGroups(routinePlans)}
        </TabsContent>

        <TabsContent value="playalongs" className="mt-0 focus-visible:outline-none space-y-12">
          {renderDifficultyGroups(playalongPlans)}
        </TabsContent>

        <TabsContent value="my_plans" className="mt-0 focus-visible:outline-none">
          {!hideSectionHeader && (
            <SectionHeader
              title="Your Custom Plans"
              subtitle={t("exercises:my_plans.custom_plans_description") as string}
              action={
                <Button
                  onClick={() => isPremium ? router.push('/plans/create') : setShowUpgradeModal(true)}
                  className="bg-white hover:bg-zinc-100 text-black font-bold uppercase tracking-widest text-[11px] h-9 px-5 rounded-lg transition-all"
                >
                  <FaPlus className="mr-2 h-3 w-3" />
                  {t("exercises:my_plans.create_plan")}
                </Button>
              }
            />
          )}
          {plans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.08] bg-zinc-900/20 p-12 text-center">
              <p className="text-zinc-500 text-sm">{t("exercises:my_plans.no_custom_plans")}</p>
              <Button
                onClick={() => isPremium ? router.push('/plans/create') : setShowUpgradeModal(true)}
                className="mt-6"
              >
                {t("exercises:my_plans.create_first")}
              </Button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onSelect={() => onPlanSelect(plan)}
                  onStart={() => onPlanSelect(plan)}
                  onEdit={() => setEditingPlan(plan)}
                  onDelete={() => handleDeletePlan(plan.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
  );

  const modal = <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />;

  if (hideLayout) {
    return <>{<div className="px-3 md:px-6">{content}</div>}{modal}</>;
  }

  return (
    <>
      <ExerciseLayout
        title={t("exercises:tabs.my_plans")}
        subtitle="Browse routines, playalongs and your custom plans"
        icon={<BookOpen size={18} />}
      >
        {content}
      </ExerciseLayout>
      {modal}
    </>
  );
};
