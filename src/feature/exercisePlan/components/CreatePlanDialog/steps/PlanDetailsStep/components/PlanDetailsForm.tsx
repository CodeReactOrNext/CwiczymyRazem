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
  const { t } = useTranslation("exercises");
  const { register, handleSubmit, control } = usePlanDetailsForm({
    selectedExercises,
    onSubmit,
    initialData,
  });

  // Reactive form values — drives the live preview as the user types / picks.
  const watched = useWatch({ control });

  const previewPlan: ExercisePlan = {
    id: "preview",
    title: watched.title || "Your plan title",
    description:
      watched.description || "A short description of your plan shows up here.",
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
        <TitleField register={register} />
        <DescriptionField register={register} />
      </div>

      {/* Appearance: icon + color with live preview */}
      <div className='space-y-3'>
        <p className='text-xs font-bold tracking-wider text-zinc-500'>Appearance</p>
        <div className='grid gap-5 md:grid-cols-2'>
          <div className='space-y-2'>
            <p className='text-[11px] font-medium text-zinc-600'>Preview</p>
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
            <p className="text-xs font-bold tracking-wider text-zinc-500">Visibility</p>
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
                  <span className={cn("text-sm font-bold", !field.value ? "text-white" : "text-zinc-400")}>Private</span>
                  {!field.value && <Check size={12} className="text-cyan-400 ml-auto" />}
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">Only visible to you.</p>
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
                  <span className={cn("text-sm font-bold", field.value ? "text-white" : "text-zinc-400")}>Public</span>
                  {field.value && <Check size={12} className="text-emerald-400 ml-auto" />}
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">Visible to all users.</p>
              </button>
            </div>
          </div>
        )}
      />

      <div className='flex justify-end gap-3 pt-6'>
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">
          Create Plan
        </Button>
      </div>
    </motion.form>
  );
};
