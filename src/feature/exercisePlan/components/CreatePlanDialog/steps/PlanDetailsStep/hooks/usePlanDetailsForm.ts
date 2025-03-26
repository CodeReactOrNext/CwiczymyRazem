import type { Exercise, ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { determinePlanCategory } from "feature/exercisePlan/utils/deteminePlanCategory";
import { determinePlanDifficulty } from "feature/exercisePlan/utils/determinePlanDifficulty";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";

export interface PlanDetailsFormData {
  title: string;
  description: string;
}

interface UsePlanDetailsFormProps {
  selectedExercises: Exercise[];
  onSubmit: (data: Omit<ExercisePlan, "id">) => void;
}

export const usePlanDetailsForm = ({ selectedExercises, onSubmit }: UsePlanDetailsFormProps) => {
  const userAuth = useSelector(selectUserAuth);
  const { register, handleSubmit, formState } = useForm<PlanDetailsFormData>();

  const handleFormSubmit = (data: PlanDetailsFormData) => {
    onSubmit({
      title: {
        pl: data.title,
        en: data.title,
      },
      description: {
        pl: data.description,
        en: data.description,
      },
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: userAuth ?? "",
      exercises: selectedExercises,
      category: determinePlanCategory(selectedExercises),
      difficulty: determinePlanDifficulty(selectedExercises),
    });
  };

  return {
    register,
    formState,
    handleSubmit: handleSubmit(handleFormSubmit),
  };
}; 