import type { Exercise, ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { determinePlanCategory } from "feature/exercisePlan/utils/deteminePlanCategory";
import { determinePlanDifficulty } from "feature/exercisePlan/utils/determinePlanDifficulty";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";

export interface PlanDetailsFormData {
  title: string;
  description: string;
  isPublic: boolean;
  icon?: string;
  color?: string;
}

interface UsePlanDetailsFormProps {
  selectedExercises: Exercise[];
  onSubmit: (data: Omit<ExercisePlan, "id">) => void;
  initialData?: ExercisePlan;
}

export const usePlanDetailsForm = ({
  selectedExercises,
  onSubmit,
  initialData
}: UsePlanDetailsFormProps) => {
  const userAuth = useSelector(selectUserAuth);

  const getInitialValue = (val: string | { pl: string; en: string } | undefined) => {
    if (!val) return "";
    return typeof val === "string" ? val : (val.pl || val.en || "");
  };

  const { register, handleSubmit, formState, control, watch, setValue } = useForm<PlanDetailsFormData>({
    defaultValues: {
      title: getInitialValue(initialData?.title),
      description: getInitialValue(initialData?.description),
      isPublic: initialData?.isPublic ?? false,
      icon: initialData?.icon,
      color: initialData?.color,
    }
  });

  const handleFormSubmit = (data: PlanDetailsFormData) => {
    onSubmit({
      title: data.title,
      description: data.description,
      isPublic: data.isPublic,
      icon: data.icon,
      color: data.color,
      image: initialData?.image ?? null,
      createdAt: initialData?.createdAt ?? new Date(),
      updatedAt: new Date(),
      userId: userAuth ?? initialData?.userId ?? "",
      exercises: selectedExercises,
      category: determinePlanCategory(selectedExercises),
      difficulty: determinePlanDifficulty(selectedExercises),
    });
  };

  return {
    register,
    formState,
    control,
    watch,
    setValue,
    handleSubmit: handleSubmit(handleFormSubmit),
  };
}; 