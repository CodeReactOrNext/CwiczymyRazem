import { cn } from "assets/lib/utils";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { useRouter } from "next/router";
import { useState } from "react";
import { useEffect } from "react";
import { useAppSelector } from "store/hooks";

import { exercisesAgregat } from "../data/exercisesAgregat";
import { defaultPlans } from "../data/plansAgregat";
import { getUserExercisePlans } from "../services/getUserExercisePlans";
import type { ExercisePlan as ExercisePlanType } from "../types/exercise.types";
import { PracticeSession } from "../views/PracticeSession/PracticeSession";
import { MyPlans } from "./MyPlans";

export const ExercisePlan = ({ hideLayout, onSessionChange, controlledTab, onTabChange }: { hideLayout?: boolean; onSessionChange?: (active: boolean) => void; controlledTab?: string; onTabChange?: (tab: string) => void }) => {
  const { t } = useTranslation("exercises");
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<ExercisePlanType | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("my_plans");
  const userAuth = useAppSelector(selectUserAuth);

  const handlePlanSelect = (plan: ExercisePlanType) => {
    setSelectedPlan(plan);
    setActiveTab("practice");
    onSessionChange?.(true);
  };

  useEffect(() => {
    const autoSelect = async () => {
      if (!router.isReady) return;
      
      const { planId, exerciseId } = router.query;
      if (!planId && !exerciseId) return;

      // Handle Plan
      if (planId) {
        let plan = defaultPlans.find(p => p.id === planId);
        if (!plan && userAuth) {
           const userPlans = await getUserExercisePlans(userAuth);
           plan = userPlans.find(p => p.id === planId);
        }
        if (plan) handlePlanSelect(plan);
        return;
      }

      // Handle Single Exercise
      if (exerciseId) {
        const exercise = exercisesAgregat.find(ex => ex.id === exerciseId);
        if (exercise) {
          const tempPlan: ExercisePlanType = {
            id: `temp-${exercise.id}`,
            title: exercise.title,
            description: exercise.description,
            exercises: [exercise],
            category: exercise.category,
            difficulty: exercise.difficulty,
            userId: "system",
            createdAt: new Date(),
            updatedAt: new Date(),
            image: null,
          };
          handlePlanSelect(tempPlan);
        }
      }
    };

    autoSelect();
  }, [router.isReady, router.query, userAuth]);

  const handleFinish = () => {
    router.push("/report");
  };

  const handleClose = () => {
    setSelectedPlan(null);
    setActiveTab("my_plans");
    onSessionChange?.(false);
  };

  return (
    <div className={cn('container mx-auto font-openSans', !selectedPlan && 'md:py-8')}>


      <div className='mt-4 sm:mt-6'>
        {activeTab === "practice" && selectedPlan ? (
          <PracticeSession
            plan={selectedPlan}
            onFinish={handleFinish}
            onClose={handleClose}
          />
        ) : (
          <MyPlans onPlanSelect={handlePlanSelect} hideTabs={["my_plans"]} hideLayout={hideLayout} controlledTab={controlledTab} onTabChange={onTabChange} />
        )}
      </div>
    </div>
  );
};
