import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "assets/components/ui/dialog";
import { CreatePlan } from "feature/exercisePlan/components/CreatePlanDialog/CreatePlan";
import { createExercisePlan } from "feature/exercisePlan/services/exerciseService";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { toast } from "sonner";

import type {
  DifficultyLevel,
  Exercise,
  ExerciseCategory,
  ExercisePlan,
  LocalizedContent,
} from "../../types/exercise.types";

interface CreatePlanDialogProps {
  onPlanCreated: (plan: ExercisePlan) => void;
  trigger?: React.ReactNode;
}

export const CreatePlanDialog = ({
  onPlanCreated,
  trigger,
}: CreatePlanDialogProps) => {
  const { t } = useTranslation("exercises");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const userAuth = useSelector(selectUserAuth);

  const handleCreatePlan = async (
    title: string | LocalizedContent,
    description: string | LocalizedContent,
    exercises: Exercise[]
  ) => {
    if (!userAuth) {
      return;
    }

    setIsLoading(true);

    try {
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
      )[0][0] as ExerciseCategory;

      // Determine difficulty level based on exercises
      const difficultyLevels = {
        beginner: 1,
        intermediate: 2,
        advanced: 3,
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

      let difficulty: DifficultyLevel = "beginner";
      if (avgDifficulty > 2.3) difficulty = "advanced";
      else if (avgDifficulty > 1.5) difficulty = "intermediate";

      // Konwertujemy title i description na LocalizedContent, jeśli są stringami
      const localizedTitle: LocalizedContent =
        typeof title === "string" ? { pl: title, en: title } : title;

      const localizedDescription: LocalizedContent =
        typeof description === "string"
          ? { pl: description, en: description }
          : description;

      const newPlan = {
        title: localizedTitle,
        description: localizedDescription,
        category: primaryCategory,
        difficulty,
        exercises,
        totalDuration,
        userId: userAuth,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const planId = await createExercisePlan(userAuth, newPlan);

      onPlanCreated({
        ...newPlan,
        id: planId,
      } as ExercisePlan);

      toast.success(t("plan.create_success"));

      setOpen(false);
    } catch (error) {
      console.error("Error creating plan:", error);
      toast.error(t("errors.create_plan_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant='default' className='w-full'>
            {t("my_plans.form.create")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-h-[90vh] max-w-4xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{t("plan.create_title")}</DialogTitle>
          <DialogDescription>{t("plan.create_description")}</DialogDescription>
        </DialogHeader>

        <CreatePlan onSubmit={handleCreatePlan} />
      </DialogContent>
    </Dialog>
  );
};
