// eslint-disable-next-line simple-import-sort/imports
import { Button } from "assets/components/ui/button";
import { ExerciseLayout } from "feature/exercisePlan/components/ExerciseLayout";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { useTranslation } from "react-i18next";
import { FaPlus } from "react-icons/fa";

import { selectUserAuth } from "feature/user/store/userSlice";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";

import { toast } from "sonner";
import { getUserExercisePlans } from "../services/getUserExercisePlans";
import type {
  Exercise,
  ExercisePlan,
  LocalizedContent,
} from "../types/exercise.types";
import { PlanCard } from "./PlanCard";
import { CreatePlan } from "./CreatePlanDialog/CreatePlan";
import { createExercisePlan } from "feature/exercisePlan/services/createExercisePlan";
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
  const userAuth = useAppSelector(selectUserAuth);

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

  const handleCreatePlan = async (
    title: string | LocalizedContent,
    description: string | LocalizedContent,
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
        title: typeof title === "string" ? title : title.en,
        description:
          typeof description === "string" ? description : description.en,
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

      toast.success(t("exercises:my_plans.create_success"));
    } catch (error) {
      logger.error(error, { context: "handleCreatePlan" });
      toast.error(t("exercises:my_plans.create_error"));
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
    return <CreatePlan onSubmit={handleCreatePlan} />;
  }

  return (
    <ExerciseLayout title={t("exercises:tabs.my_plans")}>
      <div className='space-y-8'>
        <div>
          <div className='mb-6 flex flex-col items-center justify-between gap-4 md:flex-row'>
            <div>
              <h2 className='text-2xl font-semibold'>
                {t("exercises:my_plans.custom_plans")}
              </h2>
              <p className='mt-1 text-sm text-muted-foreground'>
                {t("exercises:my_plans.custom_plans_description")}
              </p>
            </div>
            <Button onClick={() => setIsCreating(true)}>
              <FaPlus className='mr-2 h-4 w-4' />
              {t("exercises:my_plans.create_plan")}
            </Button>
          </div>

          {plans.length === 0 ? (
            <div className='rounded-lg border border-dashed p-8 text-center'>
              <p className='text-muted-foreground'>
                {t("exercises:my_plans.no_custom_plans")}
              </p>
              <Button onClick={() => setIsCreating(true)} className='mt-4'>
                {t("exercises:my_plans.create_first")}
              </Button>
            </div>
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onSelect={() => onPlanSelect(plan)}
                  onStart={() => onPlanSelect(plan)}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className='mb-6'>
            <h2 className='text-2xl font-semibold'>
              {t("exercises:my_plans.predefined_plans")}
            </h2>
            <p className='mt-1 text-sm text-muted-foreground'>
              {t("exercises:my_plans.predefined_plans_description")}
            </p>
          </div>

          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {defaultPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onSelect={() => onPlanSelect(plan)}
                onStart={() => onPlanSelect(plan)}
              />
            ))}
          </div>
        </div>
      </div>
    </ExerciseLayout>
  );
};
