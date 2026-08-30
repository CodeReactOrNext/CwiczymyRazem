import MainContainer from "components/MainContainer";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { CategoryDifficultyFilter } from "feature/practice/utils/autoPlan";
import {
  filterExercises,
  pickExercisesWithinTime,
} from "feature/practice/utils/autoPlan";
import { useState } from "react";

import type {
  DifficultyLevel,
  ExerciseCategory,
  ExercisePlan,
  LocalizedContent,
} from "../../../exercisePlan/types/exercise.types";
import { GeneratedPlan } from "./GeneratedPlan";
import { PlanSetup } from "./PlanSetup";

interface AutoPlanGeneratorProps {
  onBack: () => void;
  onSelectPlan?: (plan: ExercisePlan) => void;
  isStarting?: boolean;
}

export const AutoPlanGenerator = ({
  onBack,
  onSelectPlan,
  isStarting
}: AutoPlanGeneratorProps) => {
  const [time, setTime] = useState(30);
  const [filter, setFilter] = useState<CategoryDifficultyFilter>({});
  const [generatedPlan, setGeneratedPlan] = useState<ExercisePlan | null>(null);

  const generatePlan = () => {
    const filteredExercises = filterExercises(exercisesAgregat, filter);

    if (filteredExercises.length === 0) return;

    const selectedExercises = pickExercisesWithinTime(filteredExercises, time);

    const categoryCount: Record<string, number> = {};
    selectedExercises.forEach((exercise) => {
      categoryCount[exercise.category] =
        (categoryCount[exercise.category] || 0) + 1;
    });

    const primaryCategory = (Object.entries(categoryCount).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] as ExerciseCategory) || "mixed";

    const difficultyValues = {
      beginner: 0,
      easy: 1,
      medium: 2,
      hard: 3,
    };

    const avgDifficulty =
      selectedExercises.length > 0
        ? selectedExercises.reduce(
            (sum, exercise) =>
              sum +
              difficultyValues[
                exercise.difficulty as keyof typeof difficultyValues
              ],
            0
          ) / selectedExercises.length
        : 1;

    let difficulty: DifficultyLevel = "easy";
    if (avgDifficulty > 2.3) difficulty = "hard";
    else if (avgDifficulty > 1.5) difficulty = "medium";

    const title: LocalizedContent = `Plan ${time} minutes`;

    const description: LocalizedContent = "Automatically generated practice plan";

    const newPlan: ExercisePlan = {
      id: "auto-" + Date.now(),
      title,
      description,
      difficulty,
      category: primaryCategory,
      exercises: selectedExercises,
      userId: "system",
      image: null,
    };

    setGeneratedPlan(newPlan);
  };

  const moveExerciseUp = (index: number) => {
    if (!generatedPlan || index === 0) return;

    const updatedExercises = [...generatedPlan.exercises];
    const temp = updatedExercises[index];
    updatedExercises[index] = updatedExercises[index - 1];
    updatedExercises[index - 1] = temp;

    setGeneratedPlan({
      ...generatedPlan,
      exercises: updatedExercises,
    });
  };

  const moveExerciseDown = (index: number) => {
    if (!generatedPlan || index === generatedPlan.exercises.length - 1) return;

    const updatedExercises = [...generatedPlan.exercises];
    const temp = updatedExercises[index];
    updatedExercises[index] = updatedExercises[index + 1];
    updatedExercises[index + 1] = temp;

    setGeneratedPlan({
      ...generatedPlan,
      exercises: updatedExercises,
    });
  };

  const removeExercise = (index: number) => {
    if (!generatedPlan) return;

    const updatedExercises = generatedPlan.exercises.filter(
      (_, i) => i !== index
    );

    setGeneratedPlan({
      ...generatedPlan,
      exercises: updatedExercises,
    });
  };

  const replaceExercise = (index: number) => {
    if (!generatedPlan) return;

    const unusedExercises = exercisesAgregat.filter(
      (e) => e && !generatedPlan.exercises.some((ge) => ge.id === e.id)
    );

    // Stay inside the picked categories/difficulties, but never leave a slot
    // unreplaceable just because that pool ran dry.
    const matching = filterExercises(unusedExercises, filter);
    const filteredAvailable = matching.length > 0 ? matching : unusedExercises;

    if (filteredAvailable.length === 0) return;

    const randomIndex = Math.floor(Math.random() * filteredAvailable.length);
    const newExercise = filteredAvailable[randomIndex];

    const updatedExercises = [...generatedPlan.exercises];
    updatedExercises[index] = newExercise;

    setGeneratedPlan({
      ...generatedPlan,
      exercises: updatedExercises,
    });
  };

  const handleStart = (plan: ExercisePlan) => {
    onSelectPlan?.(plan);
  };

  if (generatedPlan) {
    return (
      <MainContainer>
        <GeneratedPlan
          plan={generatedPlan}
          onBack={() => setGeneratedPlan(null)}
          onRegenerate={generatePlan}
          onStart={handleStart}
          onMoveExerciseUp={moveExerciseUp}
          onMoveExerciseDown={moveExerciseDown}
          onReplaceExercise={replaceExercise}
          onRemoveExercise={removeExercise}
          isStarting={isStarting}
        />
      </MainContainer>
    );
  }

  return (
    <PlanSetup
      time={time}
      setTime={setTime}
      filter={filter}
      setFilter={setFilter}
      onBack={onBack}
      onGenerate={generatePlan}
    />
  );
};
