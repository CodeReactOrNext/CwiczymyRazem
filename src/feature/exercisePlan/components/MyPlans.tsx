// eslint-disable-next-line simple-import-sort/imports
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
import { Flame, Music, Zap } from "lucide-react";

import { selectUserAuth } from "feature/user/store/userSlice";
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

interface MyPlansProps {
  onPlanSelect: (plan: ExercisePlan) => void;
}

export const MyPlans = ({ onPlanSelect }: MyPlansProps) => {
  const { t } = useTranslation(["exercises", "common"]);
  const [plans, setPlans] = useState<ExercisePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ExercisePlan | null>(null);
  const userAuth = useAppSelector(selectUserAuth);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("routines");

  useEffect(() => {
    if (!router.isReady) return;
    
    const { view } = router.query;
    if (view === "create") {
      setIsCreating(true);
      setActiveTab("my_plans");
    }
  }, [router.isReady, router.query]);

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
      setIsCreating(false);

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

  if (isCreating) {
    return (
      <div className='container mx-auto'>
        <div className='mb-4 px-4'>
          <Button variant='ghost' onClick={() => setIsCreating(false)}>
            {t("common:back")}
          </Button>
        </div>
        <CreatePlan onSubmit={handleCreatePlan} />
      </div>
    );
  }

  if (editingPlan) {
    return (
      <div className='container mx-auto'>
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
            {difficultyPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onSelect={() => onPlanSelect(plan)}
                onStart={() => onPlanSelect(plan)}
              />
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <ExerciseLayout title={t("exercises:tabs.my_plans")}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Navigation Switcher */}
        <div className="mb-10 md:mb-12 sticky top-4 z-40 md:static">
          <TabsList className="bg-zinc-900/80 backdrop-blur-md border border-white/5 p-1 rounded-2xl h-auto md:bg-transparent md:border-none md:p-0 md:rounded-none md:justify-start md:space-x-12 md:w-full overflow-hidden shadow-2xl md:shadow-none w-full flex">
            <TabsTrigger 
              value="routines" 
              className="group flex-1 md:flex-none rounded-xl md:rounded-none data-[state=active]:bg-white md:data-[state=active]:bg-transparent data-[state=active]:after:hidden md:data-[state=active]:after:block data-[state=active]:text-black md:data-[state=active]:text-white text-zinc-400 md:text-zinc-500 font-bold uppercase tracking-widest text-[9px] md:text-[13px] py-2.5 md:py-5 px-3 md:px-1 transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 relative md:after:absolute md:after:bottom-0 md:after:left-0 md:after:right-0 md:after:h-0.5 md:after:bg-cyan-500 md:after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform"
            >
              <Music size={14} className="md:w-5 md:h-5 group-data-[state=active]:text-black md:group-data-[state=active]:text-cyan-400 group-hover:text-white transition-colors" />
              <span>Routines</span>
            </TabsTrigger>
            <TabsTrigger 
              value="playalongs" 
              className="group flex-1 md:flex-none rounded-xl md:rounded-none data-[state=active]:bg-white md:data-[state=active]:bg-transparent data-[state=active]:after:hidden md:data-[state=active]:after:block data-[state=active]:text-black md:data-[state=active]:text-white text-zinc-400 md:text-zinc-500 font-bold uppercase tracking-widest text-[9px] md:text-[12px] py-2.5 md:py-5 px-3 md:px-1 transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 relative md:after:absolute md:after:bottom-0 md:after:left-0 md:after:right-0 md:after:h-0.5 md:after:bg-cyan-500 md:after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform"
            >
              <Zap size={14} className="md:w-5 md:h-5 group-data-[state=active]:text-black md:group-data-[state=active]:text-cyan-400 group-hover:text-white transition-colors" />
              <span>Playalongs</span>
            </TabsTrigger>
            <TabsTrigger 
              value="my_plans" 
              className="group flex-1 md:flex-none rounded-xl md:rounded-none data-[state=active]:bg-white md:data-[state=active]:bg-transparent data-[state=active]:after:hidden md:data-[state=active]:after:block data-[state=active]:text-black md:data-[state=active]:text-white text-zinc-400 md:text-zinc-500 font-bold uppercase tracking-widest text-[9px] md:text-[12px] py-2.5 md:py-5 px-3 md:px-1 transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 relative md:after:absolute md:after:bottom-0 md:after:left-0 md:after:right-0 md:after:h-0.5 md:after:bg-cyan-500 md:after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform"
            >
              <Flame size={14} className="md:w-5 md:h-5 group-data-[state=active]:text-black md:group-data-[state=active]:text-cyan-400 group-hover:text-white transition-colors" />
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

        <TabsContent value="my_plans" className="mt-0 focus-visible:outline-none">
          <div className='mb-8 flex flex-col items-end justify-between gap-6 md:flex-row md:items-center'>
            <div className="text-right md:text-left">
              <h2 className='text-2xl font-bold text-white uppercase tracking-tight'>
                Your Custom Plans
              </h2>
              <p className='mt-1 text-xs text-zinc-500'>
                {t("exercises:my_plans.custom_plans_description")}
              </p>
            </div>
            <Button 
                onClick={() => setIsCreating(true)}
                className="bg-white hover:bg-zinc-200 text-black font-bold uppercase tracking-widest text-[11px] h-10 px-6 rounded-lg transition-all"
            >
              <FaPlus className='mr-2 h-3.5 w-3.5' />
              {t("exercises:my_plans.create_plan")}
            </Button>
          </div>
          {plans.length === 0 ? (
            <div className='rounded-2xl border border-dashed border-white/5 p-12 text-center bg-zinc-900/10'>
              <p className='text-zinc-500 text-sm'>
                {t("exercises:my_plans.no_custom_plans")}
              </p>
              <Button 
                  onClick={() => setIsCreating(true)} 
                  variant="outline"
                  className='mt-6 border-white/10 text-white font-bold uppercase tracking-widest text-[10px] h-9 px-6 rounded-lg'
              >
                {t("exercises:my_plans.create_first")}
              </Button>
            </div>
          ) : (
            <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
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
    </ExerciseLayout>
  );
};
