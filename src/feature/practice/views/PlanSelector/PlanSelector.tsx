import { Skeleton } from "assets/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { BackLink } from "components/BackLink/BackLink";
import { PAGE_CONTENT } from "components/PageShell/PageShell";
import { tabNavListClass, tabNavTriggerClass } from "components/PageTabs/tabNav";
import { SectionHeader } from "components/SectionHeader/SectionHeader";
import { SegmentedControl } from "components/SegmentedControl/SegmentedControl";
import { PlanCard } from "feature/exercisePlan/components/PlanCard";
import { PlanPreviewDialog } from "feature/exercisePlan/components/PlanPreviewDialog";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { usePublicExercisePlans, useUserExercisePlans } from "feature/exercisePlan/hooks/useExercisePlans";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { UpgradeModal } from "feature/premium/components/UpgradeModal";
import { selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import { toggleFavoritePlan } from "feature/user/store/userSlice.favoriteActions";
import { motion } from "framer-motion";
import { useRipple } from "hooks/useRipple";
import { useTranslation } from "hooks/useTranslation";
import { Flame, Globe, Music, Zap } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";

const PLAN_TABS = ["routines", "playalongs", "my_plans", "community"] as const;

// Plan-level categories used by the built-in routines, in display order. The
// filter only renders chips for the categories actually present in a tab.
const CATEGORY_ORDER = ["technique", "theory", "creativity", "hearing", "mixed"] as const;
const DIFFICULTY_ORDER = ["beginner", "easy", "medium", "hard"] as const;

const RippleTabsTrigger = ({
  value,
  icon,
  label,
  isActive,
  tooltip,
}: {
  value: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  tooltip?: string;
}) => {
  const { createRipple, ripple } = useRipple();
  const trigger = (
    <TabsTrigger
      value={value}
      onClick={createRipple}
      className={cn(tabNavTriggerClass, "relative overflow-hidden")}
    >
      {ripple}
      {icon}
      {/* On mobile only the active tab shows its label, so all four tabs stay
          visible at once; from sm up every label is shown. */}
      <span className={isActive ? "inline" : "hidden sm:inline"}>{label}</span>
    </TabsTrigger>
  );

  if (!tooltip) return trigger;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span className="contents">{trigger}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[200px] text-center">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/** Stands in for a tab's grid of PlanCards while its plans load. */
const PlanGridSkeleton = () => (
  <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3' aria-busy='true'>
    {Array.from({ length: 6 }, (_, i) => (
      <Skeleton key={i} variant='block' className='h-56' />
    ))}
  </div>
);

interface PlanSelectorProps {
  onBack?: () => void;
  onSelectPlan?: (planId: string) => void;
  loadingPlanId?: string | null;
}

export const PlanSelector = ({ onBack, onSelectPlan, loadingPlanId }: PlanSelectorProps) => {
  const { t } = useTranslation(["exercises", "common", "practice_hub"]);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const userAuth = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);
  const favoritePlanIds = userInfo?.favoritePlanIds ?? [];
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const isPremium = userInfo?.role === "pro" || userInfo?.role === "master" || userInfo?.role === "admin";

  const [activeTab, setActiveTab] = useState<(typeof PLAN_TABS)[number]>("routines");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [previewPlan, setPreviewPlan] = useState<ExercisePlan | null>(null);

  useEffect(() => {
    const queryTab = router.query.tab;
    if (typeof queryTab === "string" && (PLAN_TABS as readonly string[]).includes(queryTab)) {
      setActiveTab(queryTab as (typeof PLAN_TABS)[number]);
    }
  }, [router.query.tab]);

  // Built-in routines are bundled, so only the "My plans" and "Community" tabs
  // wait on Firestore — the rest of the page renders straight away.
  const { data: customPlans = [], isLoading: isLoadingCustom } = useUserExercisePlans(userAuth);
  const { data: communityPlans = [], isLoading: isLoadingCommunity } = usePublicExercisePlans(!!userAuth);

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

  // Favorites only resolve built-in plans (see /favorites), so user and
  // community plans render without the heart.
  const renderPlanCard = (plan: ExercisePlan, canFavorite: boolean) => {
    const locked = !!plan.premium && !isPremium;
    return (
      <PlanCard
        key={plan.id}
        plan={plan}
        isLocked={locked}
        onSelect={locked ? undefined : () => handleStartPlan(plan.id)}
        onPreview={locked ? undefined : () => setPreviewPlan(plan)}
        onStart={locked ? undefined : () => handleStartPlan(plan.id)}
        onUpgrade={locked ? () => setShowUpgradeModal(true) : undefined}
        onToggleFavorite={canFavorite && userAuth ? () => handleToggleFavorite(plan.id) : undefined}
        isFavorite={canFavorite && favoritePlanIds.includes(plan.id)}
        startButtonText={t("common:start")}
        isLoading={loadingPlanId === plan.id}
      />
    );
  };

  const renderDifficultyGroups = (sourcePlans: ExercisePlan[], canFavorite = true) => {
    const availableCategories = CATEGORY_ORDER.filter((cat) =>
      sourcePlans.some((p) => p.category === cat)
    );

    const filteredPlans =
      categoryFilter === "all"
        ? sourcePlans
        : sourcePlans.filter((p) => p.category === categoryFilter);

    const favoritePlans = canFavorite
      ? filteredPlans.filter((p) => favoritePlanIds.includes(p.id))
      : [];
    const isInFavorites = (p: ExercisePlan) => favoritePlans.includes(p);
    // Plans saved in Firestore before difficulty was derived may lack one —
    // file them under "medium" so they never drop out of the list.
    const difficultyOf = (p: ExercisePlan) =>
      (DIFFICULTY_ORDER as readonly string[]).includes(p.difficulty) ? p.difficulty : "medium";

    return (
      <>
        {availableCategories.length > 1 && (
          <SegmentedControl
            label={t("common:filters.category", "Category")}
            selected={[categoryFilter]}
            onSelect={setCategoryFilter}
            options={[
              {
                value: "all",
                label: t("common:filters.all", "All"),
                count: sourcePlans.length,
              },
              ...availableCategories.map((cat) => ({
                value: cat as string,
                label: t(`exercises:categories.${cat}` as any),
                count: sourcePlans.filter((p) => p.category === cat).length,
              })),
            ]}
          />
        )}

        {favoritePlans.length > 0 && (
          <div className="space-y-6">
            <SectionHeader
              as="h3"
              title={t("common:favorites", "FAVORITES")}
              count={favoritePlans.length}
              className="mb-0"
            />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
            >
              {favoritePlans.map((p) => renderPlanCard(p, canFavorite))}
            </motion.div>
          </div>
        )}

        {DIFFICULTY_ORDER.map((difficulty) => {
          const plans = filteredPlans.filter(
            (p) => difficultyOf(p) === difficulty && !isInFavorites(p)
          );
          if (plans.length === 0) return null;

          return (
            <div key={difficulty} className="space-y-6">
              <SectionHeader
                as="h3"
                title={t(`common:difficulty.${difficulty}`)}
                count={plans.length}
                className="mb-0"
              />

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
              >
                {plans.map((p) => renderPlanCard(p, canFavorite))}
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
        className={cn("space-y-8", PAGE_CONTENT)}
      >
              {onBack && (
                <BackLink label={t("practice_hub:back")} onClick={onBack} className='mb-4' />
              )}
              <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as (typeof PLAN_TABS)[number]); setCategoryFilter("all"); }} className="w-full">
              <TabsList className={tabNavListClass}>
                <RippleTabsTrigger value="routines" icon={<Music size={16} />} label={t("practice_hub:plans.featured")} isActive={activeTab === "routines"} />
                <RippleTabsTrigger value="playalongs" icon={<Zap size={16} />} label={t("practice_hub:plans.playalongs")} isActive={activeTab === "playalongs"} tooltip={t("practice_hub:plans.playalongs_tooltip")} />
                <RippleTabsTrigger value="my_plans" icon={<Flame size={16} />} label={t("practice_hub:plans.my_plans")} isActive={activeTab === "my_plans"} />
                <RippleTabsTrigger value="community" icon={<Globe size={16} />} label={t("practice_hub:plans.community")} isActive={activeTab === "community"} />
              </TabsList>

              <TabsContent value="routines" className="mt-6 focus-visible:outline-none space-y-8">
                {renderDifficultyGroups(routinePlans)}
              </TabsContent>

              <TabsContent value="playalongs" className="mt-6 focus-visible:outline-none space-y-8">
                {renderDifficultyGroups(playalongPlans)}
              </TabsContent>

              <TabsContent value="my_plans" className="mt-6 focus-visible:outline-none space-y-8">
                {isLoadingCustom ? (
                  <PlanGridSkeleton />
                ) : customPlans.length === 0 ? (
                  <div className='rounded-lg bg-zinc-800/40 p-12 text-center'>
                    <p className='text-zinc-400 text-sm'>
                      {t("exercises:my_plans.no_custom_plans")}
                    </p>
                  </div>
                ) : (
                  renderDifficultyGroups(customPlans, false)
                )}
              </TabsContent>

              <TabsContent value="community" className="mt-6 focus-visible:outline-none space-y-8">
                {isLoadingCommunity ? (
                  <PlanGridSkeleton />
                ) : communityPlans.length === 0 ? (
                  <div className='rounded-lg bg-zinc-800/40 p-12 text-center'>
                    <p className='text-zinc-400 text-sm'>{t("practice_hub:no_community_plans")}</p>
                    <p className='text-zinc-500 text-xs mt-2'>{t("practice_hub:publish_hint")}</p>
                  </div>
                ) : (
                  renderDifficultyGroups(communityPlans, false)
                )}
              </TabsContent>
            </Tabs>
        </motion.div>
      <PlanPreviewDialog
        plan={previewPlan}
        onClose={() => setPreviewPlan(null)}
        onOpenPlan={handleStartPlan}
        isLoading={!!previewPlan && loadingPlanId === previewPlan.id}
      />
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  );
};
