import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { PlanCard } from "feature/exercisePlan/components/PlanCard";
import type {
  Exercise,
  ExercisePlan,
} from "feature/exercisePlan/types/exercise.types";
import { determinePlanCategory } from "feature/exercisePlan/utils/deteminePlanCategory";
import { determinePlanDifficulty } from "feature/exercisePlan/utils/determinePlanDifficulty";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { Check, Globe, Lock } from "lucide-react";
import { Controller, useWatch } from "react-hook-form";

import { usePlanDetailsForm } from "../hooks/usePlanDetailsForm";
import { DescriptionField } from "./DescriptionField";
import { PlanAppearancePicker } from "./PlanAppearancePicker";
import { TitleField } from "./TitleField";

interface PlanDetailsFormProps {
  selectedExercises: Exercise[];
  onSubmit: (data: Omit<ExercisePlan, "id">) => void;
  onBack: () => void;
  initialData?: ExercisePlan;
}

export const PlanDetailsForm = ({
  selectedExercises,
  onSubmit,
  onBack,
  initialData,
}: PlanDetailsFormProps) => {
  const { t } = useTranslation(["exercises", "plans"]);
  const { register, handleSubmit, control, formState } = usePlanDetailsForm({
    selectedExercises,
    onSubmit,
    initialData,
  });

  // Reactive form values — drives the live preview as the user types / picks.
  const watched = useWatch({ control });

  // Title is the only required field — spell out what's missing next to the
  // button instead of letting it look ready while the submit silently fails.
  const missingFields = [!watched.title?.trim() && t("plans:details.plan_title")].filter(
    Boolean,
  ) as string[];

  const previewPlan: ExercisePlan = {
    id: "preview",
    title: watched.title || t("plans:details.preview_title"),
    description:
      watched.description || t("plans:details.preview_description"),
    exercises: selectedExercises,
    category: determinePlanCategory(selectedExercises),
    difficulty: determinePlanDifficulty(selectedExercises),
    userId: "",
    image: null,
    icon: watched.icon,
    color: watched.color,
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className='space-y-6 pt-4'>
      <div className='space-y-4'>
        <TitleField register={register} error={formState.errors.title} />
        <DescriptionField register={register} />
      </div>

      {/* Appearance: icon + color with live preview */}
      <div className='space-y-3'>
        <p className='text-xs font-bold tracking-wider text-zinc-500'>{t("plans:details.appearance")}</p>
        <div className='grid gap-5 md:grid-cols-2'>
          <div className='space-y-2'>
            <p className='text-[11px] font-medium text-zinc-600'>{t("plans:details.preview")}</p>
            <PlanCard plan={previewPlan} onStart={() => {}} startButtonText={t("common:start") as string} />
          </div>
          <Controller
            name="icon"
            control={control}
            render={({ field: iconField }) => (
              <Controller
                name="color"
                control={control}
                render={({ field: colorField }) => (
                  <PlanAppearancePicker
                    icon={iconField.value}
                    color={colorField.value}
                    onIconChange={iconField.onChange}
                    onColorChange={colorField.onChange}
                  />
                )}
              />
            )}
          />
        </div>
      </div>

      {/* Visibility */}
      <Controller
        name="isPublic"
        control={control}
        render={({ field }) => (
          <div className="space-y-2">
            <p className="text-xs font-bold tracking-wider text-zinc-500">{t("plans:details.visibility")}</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => field.onChange(false)}
                className={cn(
                  "flex flex-col items-start gap-2 p-4 rounded-lg border text-left transition-all",
                  !field.value
                    ? "border-cyan-500/50 bg-cyan-500/10"
                    : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                )}
              >
                <div className="flex items-center gap-2 w-full">
                  <Lock size={15} className={!field.value ? "text-cyan-400" : "text-zinc-500"} />
                  <span className={cn("text-sm font-bold", !field.value ? "text-white" : "text-zinc-400")}>{t("plans:details.private")}</span>
                  {!field.value && <Check size={12} className="text-cyan-400 ml-auto" />}
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{t("plans:details.private_hint")}</p>
              </button>
              <button
                type="button"
                onClick={() => field.onChange(true)}
                className={cn(
                  "flex flex-col items-start gap-2 p-4 rounded-lg border text-left transition-all",
                  field.value
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                )}
              >
                <div className="flex items-center gap-2 w-full">
                  <Globe size={15} className={field.value ? "text-emerald-400" : "text-zinc-500"} />
                  <span className={cn("text-sm font-bold", field.value ? "text-white" : "text-zinc-400")}>{t("plans:details.public")}</span>
                  {field.value && <Check size={12} className="text-emerald-400 ml-auto" />}
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{t("plans:details.public_hint")}</p>
              </button>
            </div>
          </div>
        )}
      />

      <div className='flex flex-wrap items-center justify-end gap-3 pt-6'>
        {missingFields.length > 0 && (
          <p className='mr-auto text-xs text-zinc-500' aria-live='polite'>
            {t("plans:details.missing", { fields: missingFields.join(", ") })}
          </p>
        )}
        <Button type="button" variant="ghost" onClick={onBack}>
          {t("plans:back")}
        </Button>
        <Button
          type="submit"
          aria-disabled={missingFields.length > 0}
          className={cn(missingFields.length > 0 && "opacity-50")}>
          {t("plans:details.create")}
        </Button>
      </div>
    </motion.form>
  );
};
