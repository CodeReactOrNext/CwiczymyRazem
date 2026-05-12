import { Button } from "assets/components/ui/button";
import type {
  Exercise,
  ExercisePlan,
} from "feature/exercisePlan/types/exercise.types";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";

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
  const { register, handleSubmit } = usePlanDetailsForm({
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
