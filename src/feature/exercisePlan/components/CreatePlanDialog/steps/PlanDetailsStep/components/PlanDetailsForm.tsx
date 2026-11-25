import { Button, PRESSABLE_KEY } from "assets/components/ui/button";
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
import type { LucideIcon } from "lucide-react";
import { Check, Globe, Lock } from "lucide-react";
import { Controller, useWatch } from "react-hook-form";

import { usePlanDetailsForm } from "../hooks/usePlanDetailsForm";
import { DescriptionField } from "./DescriptionField";
import { PlanAppearancePicker } from "./PlanAppearancePicker";
import { TitleField } from "./TitleField";

/**
 * One answer to who can see the plan. The picked one is green with a ticked
 * dot, like every picked choice in the app; the other is a plain key.
 */
const VisibilityTile = ({
  icon: Icon,
  title,
  hint,
  selected,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type='button'
    role='radio'
    aria-checked={selected}
    onClick={onClick}
    className={cn(
      PRESSABLE_KEY,
      "flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:px-[18px] sm:py-4",
      selected ? "bg-emerald-500/15 hover:bg-emerald-500/20" : "bg-zinc-800 hover:bg-zinc-700/70",
    )}>
    <Icon aria-hidden className={cn("h-[18px] w-[18px] shrink-0", selected ? "text-emerald-400" : "text-zinc-400")} />
    <span className='min-w-0 flex-1'>
      <span className={cn("block text-sm font-bold", selected ? "text-emerald-300" : "text-zinc-200")}>{title}</span>
      <span className={cn("block text-xs leading-snug", selected ? "text-emerald-200/70" : "text-zinc-400")}>{hint}</span>
    </span>
    <span
      aria-hidden
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
        selected ? "bg-emerald-500 text-emerald-950" : "ring-2 ring-inset ring-zinc-600",
      )}>
      {selected && <Check className='h-3 w-3' strokeWidth={3.5} />}
    </span>
  </button>
);

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
        <p className='text-xs font-medium text-zinc-400'>{t("plans:details.appearance")}</p>
        <div className='grid gap-5 md:grid-cols-2'>
          <div className='space-y-2'>
            <p className='text-xs font-medium text-zinc-400'>{t("plans:details.preview")}</p>
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
          <div className="space-y-2.5">
            <p id="plan-visibility" className="text-sm font-semibold text-zinc-200">{t("plans:details.visibility")}</p>
            <div role="radiogroup" aria-labelledby="plan-visibility" className="grid gap-3 sm:grid-cols-2">
              <VisibilityTile
                icon={Lock}
                title={t("plans:details.private")}
                hint={t("plans:details.private_hint")}
                selected={!field.value}
                onClick={() => field.onChange(false)}
              />
              <VisibilityTile
                icon={Globe}
                title={t("plans:details.public")}
                hint={t("plans:details.public_hint")}
                selected={!!field.value}
                onClick={() => field.onChange(true)}
              />
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
        <Button type="button" variant="ghost" size="lg" onClick={onBack}>
          {t("plans:back")}
        </Button>
        <Button
          type="submit"
          size="lg"
          aria-disabled={missingFields.length > 0}
          // Grey until it has a name, like the builder's Next — still clickable,
          // so a press shows what's missing.
          className={cn("font-extrabold", missingFields.length > 0 && "bg-zinc-800 text-zinc-500 hover:bg-zinc-800")}>
          {initialData ? t("plans:details.save") : t("plans:details.create")}
        </Button>
      </div>
    </motion.form>
  );
};
