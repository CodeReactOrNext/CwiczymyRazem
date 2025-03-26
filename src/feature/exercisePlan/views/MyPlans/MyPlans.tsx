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
import {
  getUserExercisePlans,
} from "../../services/getUserExercisePlans";
import type {
  Exercise,
  ExercisePlan,
  LocalizedContent,
} from "../../types/exercise.types";
import { PlanCard } from "../../components/PlanCard";
import { CreatePlan } from "../../components/CreatePlanDialog/CreatePlan";
import { createExercisePlan } from "feature/exercisePlan/services/createExercisePlan";

interface MyPlansProps {
  onPlanSelect: (plan: ExercisePlan) => void;
}

const planGradients = {
  technique:
    "from-blue-500/5 via-transparent to-indigo-500/5 hover:from-blue-500/10 hover:to-indigo-500/10",
  theory:
    "from-emerald-500/5 via-transparent to-green-500/5 hover:from-emerald-500/10 hover:to-green-500/10",
  creativity:
    "from-purple-500/5 via-transparent to-pink-500/5 hover:from-purple-500/10 hover:to-pink-500/10",
  hearing:
    "from-orange-500/5 via-transparent to-amber-500/5 hover:from-orange-500/10 hover:to-amber-500/10",
};

export const MyPlans = ({ onPlanSelect }: MyPlansProps) => {
  const { t } = useTranslation(["exercises", "common"]);
  const [plans, setPlans] = useState<ExercisePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const userAuth = useAppSelector(selectUserAuth);

  useEffect(() => {
    const loadPlans = async () => {
      if (!userAuth) return;

      try {
        const userPlans = await getUserExercisePlans(userAuth);
        setPlans(userPlans);
      } catch (error) {
        console.error("Error loading plans:", error);
        toast.error(t("exercises:errors.load_plans_failed"));
      } finally {
        setIsLoading(false);
      }
    };

    loadPlans();
  }, [userAuth, t]);

  const handleCreatePlan = async (
    title: string | LocalizedContent,
    description: string | LocalizedContent,
    exercises: Exercise[]
  ): Promise<void> => {
    try {
      if (!userAuth) {
        console.error("User not authenticated");
        return;
      }

      const totalDuration = exercises.reduce(
        (acc, exercise) => acc + exercise.timeInMinutes,
        0
      );

      // Determine the primary category based on exercises
      const categoryCount: Record<string, number> = {};
      exercises.forEach((exercise) => {
        categoryCount[exercise.category] =
          (categoryCount[exercise.category] || 0) + 1;
      });

      const primaryCategory = Object.entries(categoryCount).sort(
        (a, b) => b[1] - a[1]
      )[0][0] as any;

      // Determine difficulty level based on exercises
      const difficultyLevels = {
        easy: 1,
        medium: 2,
        hard: 3,
      };

      const avgDifficulty =
        exercises.reduce(
          (acc, exercise) =>
            acc +
            difficultyLevels[
              exercise.difficulty as keyof typeof difficultyLevels
            ],
          0
        ) / exercises.length;

      let difficulty: "easy" | "medium" | "hard" = "easy";
      if (avgDifficulty > 2.3) difficulty = "hard";
      else if (avgDifficulty > 1.5) difficulty = "medium";

      // Konwertujemy title i description na LocalizedContent, jeśli są stringami
      const localizedTitle: LocalizedContent =
        typeof title === "string" ? { pl: title, en: title } : title;

      const localizedDescription: LocalizedContent =
        typeof description === "string"
          ? { pl: description, en: description }
          : description;

      const planData = {
        title: localizedTitle,
        description: localizedDescription,
        category: primaryCategory,
        difficulty,
        exercises,
        totalDuration,
        userId: userAuth,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
      };

      // Zapisz plan w Firebase
      const planId = await createExercisePlan(userAuth, planData);

      // Dodaj plan do lokalnego stanu
      const newPlan: ExercisePlan = {
        ...planData,
        id: planId,
      };

      setPlans((prevPlans) => [...prevPlans, newPlan]);
      setIsCreating(false);

      toast.success(t("exercises:my_plans.create_success"));
    } catch (error) {
      console.error("Error creating plan:", error);
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
        {/* Sekcja własnych planów */}
        <div>
          <div className='mb-6 flex items-center justify-between'>
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
