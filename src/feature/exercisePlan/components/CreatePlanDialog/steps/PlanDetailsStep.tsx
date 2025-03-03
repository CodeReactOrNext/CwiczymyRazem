import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import { Textarea } from "assets/components/ui/textarea";
import { selectUserAuth } from "feature/user/store/userSlice";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import type { Exercise, ExercisePlan } from "../../../types/exercise.types";

interface PlanDetailsStepProps {
  onSubmit: (data: Omit<ExercisePlan, "id">) => void;
  selectedExercises: Exercise[];
}

interface FormData {
  title: string;
  description: string;
}

export const PlanDetailsStep = ({
  onSubmit,
  selectedExercises,
}: PlanDetailsStepProps) => {
  const { t } = useTranslation("exercises");
  const userAuth = useSelector(selectUserAuth);
  const { register, handleSubmit } = useForm<FormData>();

  const onFormSubmit = (data: FormData) => {
    onSubmit({
      title: {
        pl: data.title,
        en: data.title,
      },
      
      description: {
        pl: data.description,
        en: data.description,
      },
      exercises: selectedExercises,
      totalDuration: selectedExercises.reduce(
        (acc, exercise) => acc + exercise.timeInMinutes,
        0
      ),
      category: "technique",
      userId: userAuth ?? "",
      createdAt: new Date(),
      updatedAt: new Date(),
      difficulty: "beginner",
    });
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit(onFormSubmit)}
      className='space-y-6'>
      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='title'>{t("plan.title")}</Label>
          <Input
            id='title'
            placeholder={t("plan.title_placeholder")}
            {...register("title", { required: true })}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='description'>{t("plan.description")}</Label>
          <Textarea
            id='description'
            placeholder={t("plan.description_placeholder")}
            rows={4}
            {...register("description", { required: true })}
          />
          <p className='text-xs text-muted-foreground'>
            {t("plan.tips.good_description")}
          </p>
        </div>
      </div>

      <div className='flex justify-end'>
        <Button type='submit'>{t("common.next")}</Button>
      </div>
    </motion.form>
  );
};
