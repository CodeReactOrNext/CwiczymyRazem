// eslint-disable-next-line simple-import-sort/imports
import React from "react";
import { Button } from "assets/components/ui/button";
import { ConfirmDialog } from "components/ConfirmDialog/ConfirmDialog";
import { EmptyState } from "components/EmptyState/EmptyState";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import { BackLink } from "components/BackLink/BackLink";
import { cn } from "assets/lib/utils";
import { PAGE_CONTENT } from "components/PageShell/PageShell";
import { tabNavListClass, tabNavTriggerClass } from "components/PageTabs/tabNav";
import { SectionHeader } from "components/SectionHeader/SectionHeader";
import { ExerciseLayout } from "feature/exercisePlan/components/ExerciseLayout";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { useTranslation } from "hooks/useTranslation";
import { Flame, Music, Zap, Plus } from "lucide-react";
import { Skeleton } from "assets/components/ui/skeleton";
import { motion } from "framer-motion";

import { UpgradeModal } from "feature/premium/components/UpgradeModal";
import { selectUserAuth, selectUserAvatar, selectUserInfo, selectUserName } from "feature/user/store/userSlice";
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
import { LibrarySortSelect } from "components/LibrarySortSelect/LibrarySortSelect";
import { useLibrarySort } from "hooks/useLibrarySort";
import { sortLibraryItems } from "utils/librarySort";

const getLocalizedTitle = (value: string | { en?: string; pl?: string } | undefined): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.pl || value.en || '';
};

interface MyPlansProps {
  onPlanSelect: (plan: ExercisePlan) => void;
  hideTabs?: Array<"routines" | "playalongs" | "my_plans">;
  hideLayout?: boolean;
  controlledTab?: string;
  onTabChange?: (tab: string) => void;
  hideSectionHeader?: boolean;
  /** Reports how many custom plans the user has once they're loaded. */
  onPlansLoaded?: (count: number) => void;
}

export const MyPlans = ({ onPlanSelect, hideTabs = [], hideLayout, controlledTab, onTabChange, hideSectionHeader, onPlansLoaded }: MyPlansProps) => {
  const { t } = useTranslation(["exercises", "common", "plans"]);
  const [plans, setPlans] = useState<ExercisePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<ExercisePlan | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const userAuth = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);
  const userName = useAppSelector(selectUserName);
  const userAvatar = useAppSelector(selectUserAvatar);
  const isPremium = userInfo?.role === "pro" || userInfo?.role === "master" || userInfo?.role === "admin";
  const router = useRouter();
  const [internalTab, setInternalTab] = useState(
    hideTabs.includes("routines") ? "my_plans" : "routines"
  );
  const [sort, setSort] = useLibrarySort("riffquest.myPlansSort");
  const sortedPlans = sortLibraryItems(plans, sort, (plan) => ({
    title: plan.title ?? "",
    createdAtMs: plan.createdAt?.getTime() ?? null,
  }));
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

  useEffect(() => {
    if (!isLoading) onPlansLoaded?.(plans.length);
  }, [isLoading, plans.length, onPlansLoaded]);

  // Filter playalongs from routines
  const playalongPlans = defaultPlans.filter(p => p.exercises.some(e => e.isPlayalong));
  const routinePlans = defaultPlans.filter(p => !p.exercises.some(e => e.isPlayalong));

  const handleCreatePlan = async (
    title: string,
    description: string,
    exercises: Exercise[],
    isPublic: boolean,
    appearance?: { icon?: string; color?: string }
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
        isPublic,
        category: determinePlanCategory(exercises),
        difficulty: determinePlanDifficulty(exercises),
        exercises,
        userId: userAuth,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
        icon: appearance?.icon,
        color: appearance?.color,
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
        icon: updatedPlan.icon,
        color: updatedPlan.color,
      });

      setPlans((prevPlans) =>
        prevPlans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
      );
      setEditingPlan(null);
      toast.success(t("exercises:my_plans.update_success") as string);
    } catch (error) {
      logger.error(error, { context: "handleUpdatePlan" });
      toast.error(t("exercises:my_plans.update_error") as string);
    }
  };

  const [planPendingDelete, setPlanPendingDelete] = useState<ExercisePlan | null>(null);

  const handleDeletePlan = async (planId: string) => {
    try {
      await deleteExercisePlan(planId);
      setPlans((prevPlans) => prevPlans.filter((p) => p.id !== planId));
      toast.success(t("common:success") as string);
    } catch (error) {
      logger.error(error, { context: "handleDeletePlan" });
      toast.error(t("common:error") as string);
    } finally {
      setPlanPendingDelete(null);
    }
  };

  const handleTogglePublic = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    const newIsPublic = !plan.isPublic;
    // Optimistic update — icon changes immediately
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, isPublic: newIsPublic } : p));
    try {
      await updateExercisePlan(planId, {
        isPublic: newIsPublic,
        authorUsername: userName ?? undefined,
        authorAvatar: userAvatar ?? undefined,
      });
      toast.success(newIsPublic ? t("plans:my.published") : t("plans:my.unpublished"));
    } catch (error) {
      // Revert on failure
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, isPublic: plan.isPublic } : p));
      logger.error(error, { context: "handleTogglePublic" });
      toast.error(t("plans:my.visibility_error"));
    }
  };

  if (isLoading) {
    // Card-shaped placeholders in the grid the plans land in, so the page
    // doesn't jump when they arrive.
    return (
      <div
        aria-busy
        className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", hideLayout && PAGE_CONTENT)}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant='block' className='h-[188px]' />
        ))}
      </div>
    );
  }

  if (editingPlan) {
    return (
      <div className='container mx-auto px-4 lg:px-8 py-8 md:py-12'>
        <div className='mb-6 flex items-center gap-4 px-4'>
          <BackLink
            label={t("common:back")}
            onClick={() => setEditingPlan(null)}
            className='shrink-0'
          />
          <span className='truncate text-sm font-semibold text-zinc-300'>
            {getLocalizedTitle(editingPlan.title)}
          </span>
        </div>
        <CreatePlan initialPlan={editingPlan} onSubmit={handleCreatePlan} onUpdate={handleUpdatePlan} />
      </div>
    );
  }

  const renderDifficultyGroups = (sourcePlans: ExercisePlan[]) => {
    return (["beginner", "easy", "medium", "hard"] as const).map((difficulty) => {
      const difficultyPlans = sourcePlans.filter((p) => p.difficulty === difficulty);
      if (difficultyPlans.length === 0) return null;

      return (
        <div key={difficulty} className="space-y-6">
          <SectionHeader
            as="h3"
            title={t(`common:difficulty.${difficulty}`)}
            count={difficultyPlans.length}
            className="mb-0"
          />

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
        {!controlledTab && (["routines", "playalongs", "my_plans"] as const).filter(t => !hideTabs.includes(t)).length > 1 && <div className="mb-10 md:mb-12">
          <TabsList className={tabNavListClass}>
            {!hideTabs.includes("routines") && (
              <TabsTrigger value="routines" className={tabNavTriggerClass}>
                <Music size={16} />
                <span>{t("plans:my.routines")}</span>
              </TabsTrigger>
            )}
            {!hideTabs.includes("playalongs") && (
              <TabsTrigger value="playalongs" className={tabNavTriggerClass}>
                <Zap size={16} />
                <span>{t("plans:my.playalongs")}</span>
              </TabsTrigger>
            )}
            {!hideTabs.includes("my_plans") && (
              <TabsTrigger value="my_plans" className={tabNavTriggerClass}>
                <Flame size={16} />
                <span>{t("plans:my.my_plans")}</span>
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
              title={t("plans:my.custom_title")}
              description={t("exercises:my_plans.custom_plans_description") as string}
              action={
                <Button
                  onClick={() => isPremium ? router.push('/plans/create') : setShowUpgradeModal(true)}
                >
                  <Plus />
                  {t("exercises:my_plans.create_plan")}
                </Button>
              }
            />
          )}
          {plans.length === 0 ? (
            // The one place to start a first plan: say what a plan is, show a
            // tiny example, and offer the ready-made plans as a way in.
            <EmptyState
              title={t("exercises:my_plans.no_custom_plans")}
              description={t("plans:my.what_is_plan")}
              action={
                <div className="flex w-full flex-col items-center gap-6">
                  <div className="w-full max-w-xs space-y-1.5 text-left text-sm">
                    <p className="text-xs font-semibold text-zinc-400">{t("plans:my.for_example")}</p>
                    {[
                      [t("plans:my.example_1"), "5 min"],
                      [t("plans:my.example_2"), "10 min"],
                      [t("plans:my.example_3"), "10 min"],
                    ].map(([name, time]) => (
                      <div key={name} className="flex items-center justify-between text-zinc-300">
                        <span>{name}</span>
                        <span className="tabular-nums text-zinc-500">{time}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Button size='lg' onClick={() => isPremium ? router.push('/plans/create') : setShowUpgradeModal(true)}>
                      {t("exercises:my_plans.create_first")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push("/timer/plans")}
                    >
                      {t("plans:my.ready_made")}
                    </Button>
                  </div>
                </div>
              }
            />
          ) : (
            <>
            {plans.length > 1 && (
              <div className="mb-6 flex justify-end">
                <LibrarySortSelect value={sort} onChange={setSort} />
              </div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {sortedPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onSelect={() => onPlanSelect(plan)}
                  onStart={() => onPlanSelect(plan)}
                  onEdit={() => setEditingPlan(plan)}
                  onDelete={() => setPlanPendingDelete(plan)}
                  onTogglePublic={() => handleTogglePublic(plan.id)}
                />
              ))}
            </motion.div>
            </>
          )}
        </TabsContent>
      </Tabs>
  );

  const modal = (
    <>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      <ConfirmDialog
        open={!!planPendingDelete}
        onOpenChange={(open) => !open && setPlanPendingDelete(null)}
        title={t("plans:my.delete_title")}
        description={t("plans:my.delete_body", { title: getLocalizedTitle(planPendingDelete?.title) })}
        cancelLabel={t("plans:cancel")}
        confirmLabel={t("plans:delete")}
        onConfirm={() => {
          if (planPendingDelete) handleDeletePlan(planPendingDelete.id);
        }}
        destructive
      />
    </>
  );

  if (hideLayout) {
    return <>{<div className={PAGE_CONTENT}>{content}</div>}{modal}</>;
  }

  return (
    <>
      <ExerciseLayout
        title={t("exercises:tabs.my_plans")}
        subtitle={t("plans:my.subtitle")}
      >
        {content}
      </ExerciseLayout>
      {modal}
    </>
  );
};
