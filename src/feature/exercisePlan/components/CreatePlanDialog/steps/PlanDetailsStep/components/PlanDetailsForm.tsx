import { cn } from "assets/lib/utils";
import { Button } from "assets/components/ui/button";
import type {
  Exercise,
  ExercisePlan,
} from "feature/exercisePlan/types/exercise.types";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { Check, Globe, Lock } from "lucide-react";
import { Controller } from "react-hook-form";

import { usePlanDetailsForm } from "../hooks/usePlanDetailsForm";
import { DescriptionField } from "./DescriptionField";
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

      {/* Visibility */}
      <Controller
        name="isPublic"
        control={control}
        render={({ field }) => (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Visibility</p>
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
