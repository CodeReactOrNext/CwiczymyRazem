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
import { ScaleSelectionDialog } from "feature/exercisePlan/views/PracticeSession/components/ScaleSelectionDialog";
import { ChordSelectionDialog } from "feature/exercisePlan/views/PracticeSession/components/ChordSelectionDialog";

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
  const [editingExercise, setEditingExercise] = useState<Exercise | undefined>(undefined);
  const [customExerciseMode, setCustomExerciseMode] = useState<"create" | "edit" | "clone">("create");
  const [isScaleDialogOpen, setIsScaleDialogOpen] = useState(false);
  const [isChordDialogOpen, setIsChordDialogOpen] = useState(false);

  const {
    searchQuery,
    selectedCategory,
    selectedDifficulty,
    groupedExercises,
    filteredExercises,
    handleExerciseToggle,
    setSearchQuery,
    setSelectedCategory,
    setSelectedDifficulty,
  } = useExerciseSelection({
    selectedExercises,
    onExercisesSelect,
  });

  const handleCustomExerciseCreate = (exercise: Exercise) => {
    if (customExerciseMode === "edit") {
        onExercisesSelect(selectedExercises.map(e => e.id === exercise.id ? exercise : e));
    } else {
        onExercisesSelect([...selectedExercises, exercise]);
    }
  };

  const handleEditExercise = (exercise: Exercise) => {
      setEditingExercise(exercise);
      setCustomExerciseMode("edit");
      setIsCustomExerciseDialogOpen(true);
  };

  const handleCloneExercise = (exercise: Exercise) => {
      setEditingExercise(exercise);
      setCustomExerciseMode("clone");
      setIsCustomExerciseDialogOpen(true);
  };

  const handleCreateCustomOpen = () => {
      setEditingExercise(undefined);
      setCustomExerciseMode("create");
      setIsCustomExerciseDialogOpen(true);
  };

  const handleScaleGenerated = (generatedExercise: Exercise) => {
      // Add the configured scale exercise to selected exercises
      onExercisesSelect([...selectedExercises, generatedExercise]);
      setIsScaleDialogOpen(false);
  };

  const handleChordGenerated = (generatedExercise: Exercise) => {
      // Add the configured chord exercise to selected exercises
      onExercisesSelect([...selectedExercises, generatedExercise]);
      setIsChordDialogOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className='space-y-8'>
      <div className='flex flex-col gap-6 sm:flex-row sm:items-end justify-between border-b border-white/5 pb-6'>
        <div className="space-y-1">
          <h2 className='text-3xl font-black tracking-tighter text-zinc-100'>
            {t("exercises:my_plans.create_dialog.exercises")}
          </h2>
          <p className='text-sm text-zinc-500 font-medium max-w-md leading-relaxed'>
            {t("exercises:my_plans.create_dialog.select_exercises_description")}
          </p>
        </div>
        <div className='flex items-center gap-3 shrink-0'>
          <Button
            onClick={() => setIsScaleDialogOpen(true)}
            variant="outline"
            className='bg-gradient-to-br from-indigo-900/50 to-blue-900/50 border-indigo-500/30 hover:border-indigo-400/50 hover:from-indigo-800/60 hover:to-blue-800/60 text-indigo-300 hover:text-indigo-200 transition-all gap-2 h-11 px-5 font-bold tracking-tight shadow-lg shadow-indigo-500/10'>
            <FaPlus className="h-3.5 w-3.5" />
            Create Scale
          </Button>
          <Button
            onClick={() => setIsChordDialogOpen(true)}
            variant="outline"
            className='bg-gradient-to-br from-emerald-900/50 to-teal-900/50 border-emerald-500/30 hover:border-emerald-400/50 hover:from-emerald-800/60 hover:to-teal-800/60 text-emerald-300 hover:text-emerald-200 transition-all gap-2 h-11 px-5 font-bold tracking-tight shadow-lg shadow-emerald-500/10'>
            <FaPlus className="h-3.5 w-3.5" />
            Create Chords
          </Button>
          <Button
            onClick={handleCreateCustomOpen}
            variant="outline"
            className='bg-zinc-900/50 border-white/10 hover:bg-zinc-800 hover:border-zinc-500/50 hover:text-zinc-200 transition-all gap-2 h-11 px-5 font-bold tracking-tight'>
            <FaPlus className="h-3.5 w-3.5" />
            {t("exercises:custom_exercise.button_label")}
          </Button>
          <Button
            onClick={onNext}
            disabled={selectedExercises.length === 0}
            className="h-11 px-8 bg-white text-black hover:bg-zinc-200 font-bold tracking-widest transition-all disabled:opacity-50">
            {t("common:next")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-5 sticky top-6 min-w-0">
          <SelectedExercisesList
            selectedExercises={selectedExercises}
            onToggleExercise={handleExerciseToggle}
            onEditExercise={handleEditExercise}
            onCloneExercise={handleCloneExercise}
          />
        </div>

        <div className="lg:col-span-7 space-y-6 min-w-0">
          <ExerciseFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedDifficulty={selectedDifficulty}
            onDifficultyChange={setSelectedDifficulty}
            groupedExercises={groupedExercises}
          />

          <ExerciseGrid
            exercises={filteredExercises}
            selectedExercises={selectedExercises}
            onToggleExercise={handleExerciseToggle}
          />
        </div>
      </div>

      <CreateCustomExerciseDialog
        open={isCustomExerciseDialogOpen}
        onOpenChange={setIsCustomExerciseDialogOpen}
        onExerciseCreate={handleCustomExerciseCreate}
        initialData={editingExercise}
        mode={customExerciseMode}
      />

      <ScaleSelectionDialog
        isOpen={isScaleDialogOpen}
        onClose={() => setIsScaleDialogOpen(false)}
        onExerciseGenerated={handleScaleGenerated}
      />

      <ChordSelectionDialog
        isOpen={isChordDialogOpen}
        onClose={() => setIsChordDialogOpen(false)}
        onExerciseGenerated={handleChordGenerated}
      />
    </motion.div>
  );
};
