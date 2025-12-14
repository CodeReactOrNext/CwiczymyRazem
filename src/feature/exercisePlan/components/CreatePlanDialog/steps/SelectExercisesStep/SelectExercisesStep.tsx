import { Button } from "assets/components/ui/button";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { ExerciseFilters } from "./components/ExerciseFilters";
import { ExerciseGrid } from "./components/ExerciseGrid";
import { SelectedExercisesList } from "./components/SelectedExercisesList";
import { useExerciseSelection } from "./hooks/useExerciseSelection";

interface SelectExercisesStepProps {
  selectedExercises: Exercise[];
  onExercisesSelect: (exercises: Exercise[]) => void;
  onNext: () => void;
}

export const SelectExercisesStep = ({
  selectedExercises,
  onExercisesSelect,
  onNext,
}: SelectExercisesStepProps) => {
  const { t } = useTranslation(["exercises", "common"]);
  /* Removed currentLang setup */

  const {
    searchQuery,
    selectedCategory,
    groupedExercises,
    filteredExercises,
    handleExerciseToggle,
    setSearchQuery,
    setSelectedCategory,
  } = useExerciseSelection({
    selectedExercises,
    onExercisesSelect,
    /* Removed currentLang */
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className='space-y-6'>
      <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
        <div>
          <h2 className='text-2xl font-bold'>
            {t("exercises:my_plans.create_dialog.exercises")}
          </h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            {t("exercises:my_plans.create_dialog.select_exercises_description")}
          </p>
        </div>
        <div className='flex w-full flex-row items-center justify-between gap-3 sm:w-fit md:flex-col'>
          <Button
            onClick={onNext}
            disabled={selectedExercises.length === 0}
            className='w-full sm:flex md:w-fit'>
            {t("common:next")}
          </Button>
        </div>
      </div>

      <SelectedExercisesList
        selectedExercises={selectedExercises}
        /* Removed currentLang */
        onToggleExercise={handleExerciseToggle}
      />

      <ExerciseFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        groupedExercises={groupedExercises}
      />

      <ExerciseGrid
        exercises={filteredExercises}
        selectedExercises={selectedExercises}
        onToggleExercise={handleExerciseToggle}
        /* Removed currentLang */
      />

      <Button
        onClick={onNext}
        disabled={selectedExercises.length === 0}
        className='w-full'>
        {t("common:next")}
      </Button>
    </motion.div>
  );
};
