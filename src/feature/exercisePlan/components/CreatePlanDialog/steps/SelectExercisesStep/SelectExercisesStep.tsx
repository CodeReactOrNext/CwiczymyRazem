import { Button } from "assets/components/ui/button";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";

import { ExerciseFilters } from "./components/ExerciseFilters";
import { ExerciseGrid } from "./components/ExerciseGrid";
import { SelectedExercisesList } from "./components/SelectedExercisesList";
import { CreateCustomExerciseDialog } from "./CreateCustomExerciseDialog";
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
  const [isCustomExerciseDialogOpen, setIsCustomExerciseDialogOpen] = useState(false);

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
  });

  const handleCustomExerciseCreate = (exercise: Exercise) => {
    onExercisesSelect([...selectedExercises, exercise]);
  };

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
        <div className='flex items-center gap-3'>
          <Button
            onClick={() => setIsCustomExerciseDialogOpen(true)}
            variant="outline"
            className='whitespace-nowrap'>
            <FaPlus className="mr-2 h-4 w-4" />
            {t("exercises:custom_exercise.button_label")}
          </Button>
          <Button
            onClick={onNext}
            disabled={selectedExercises.length === 0}>
            {t("common:next")}
          </Button>
        </div>
      </div>

      <SelectedExercisesList
        selectedExercises={selectedExercises}
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
      />

      <CreateCustomExerciseDialog 
        open={isCustomExerciseDialogOpen} 
        onOpenChange={setIsCustomExerciseDialogOpen} 
        onExerciseCreate={handleCustomExerciseCreate}
      />
    </motion.div>
  );
};
