import { Button } from "assets/components/ui/button";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { ChordSelectionDialog } from "feature/exercisePlan/views/PracticeSession/components/ChordSelectionDialog";
import { ScaleSelectionDialog } from "feature/exercisePlan/views/PracticeSession/components/ScaleSelectionDialog";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";

import { AddExerciseTimeDialog } from "./components/AddExerciseTimeDialog";
import { ExerciseFilters } from "./components/ExerciseFilters";
import { ExerciseGrid } from "./components/ExerciseGrid";
import { ExercisePreviewDialog } from "./components/ExercisePreviewDialog";
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
  const [editingExercise, setEditingExercise] = useState<Exercise | undefined>(undefined);
  const [customExerciseMode, setCustomExerciseMode] = useState<"create" | "edit" | "clone">("create");
  const [isScaleDialogOpen, setIsScaleDialogOpen] = useState(false);
  const [isChordDialogOpen, setIsChordDialogOpen] = useState(false);
  const [pendingExercise, setPendingExercise] = useState<Exercise | undefined>(undefined);
  const [editingBuiltinExercise, setEditingBuiltinExercise] = useState<Exercise | undefined>(undefined);
  const [previewingExercise, setPreviewingExercise] = useState<Exercise | undefined>(undefined);

  const {
    searchQuery,
    selectedCategory,
    selectedDifficulty,
    selectedSkill,
    availableSkills,
    groupedExercises,
    filteredExercises,
    handleExerciseToggle,
    setSearchQuery,
    setSelectedCategory,
    setSelectedDifficulty,
    setSelectedSkill,
  } = useExerciseSelection({
    selectedExercises,
    onExercisesSelect,
  });

  const handleExerciseToggleWithTimeModal = (exercise: Exercise) => {
    const isAlreadySelected = selectedExercises.some((e) => e.id === exercise.id);
    if (isAlreadySelected) {
      handleExerciseToggle(exercise);
    } else {
      setPendingExercise(exercise);
    }
  };

  const handleTimeConfirm = (exercise: Exercise, timeInMinutes: number) => {
    const isAlreadySelected = selectedExercises.some((e) => e.id === exercise.id);
    if (isAlreadySelected) {
      onExercisesSelect(selectedExercises.map((e) => (e.id === exercise.id ? { ...e, timeInMinutes } : e)));
    } else {
      onExercisesSelect([...selectedExercises, { ...exercise, timeInMinutes }]);
    }
    setPendingExercise(undefined);
  };

  const handleCustomExerciseCreate = (exercise: Exercise) => {
    if (customExerciseMode === "edit") {
        onExercisesSelect(selectedExercises.map(e => e.id === exercise.id ? exercise : e));
    } else {
        onExercisesSelect([...selectedExercises, exercise]);
    }
  };

  const handleEditExercise = (exercise: Exercise) => {
    if (exercise.id.startsWith("custom-")) {
      setEditingExercise(exercise);
      setCustomExerciseMode("edit");
      setIsCustomExerciseDialogOpen(true);
    } else if (exercise.id.startsWith("scale_")) {
      setEditingBuiltinExercise(exercise);
      setIsScaleDialogOpen(true);
    } else if (exercise.id.startsWith("chord_changes_")) {
      setEditingBuiltinExercise(exercise);
      setIsChordDialogOpen(true);
    }
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

  const handleCreateScaleOpen = () => {
      setEditingBuiltinExercise(undefined);
      setIsScaleDialogOpen(true);
  };

  const handleCreateChordOpen = () => {
      setEditingBuiltinExercise(undefined);
      setIsChordDialogOpen(true);
  };

  const handleScaleGenerated = (generatedExercise: Exercise) => {
      if (editingBuiltinExercise) {
         onExercisesSelect(selectedExercises.map(e => e.id === editingBuiltinExercise.id ? generatedExercise : e));
      } else {
         onExercisesSelect([...selectedExercises, generatedExercise]);
      }
      setIsScaleDialogOpen(false);
      setEditingBuiltinExercise(undefined);
  };

  const handleEditTimeRequest = (exercise: Exercise) => {
    setPendingExercise(exercise);
  };

  const handleReorder = (reordered: Exercise[]) => {
    onExercisesSelect(reordered);
  };

  const handleChordGenerated = (generatedExercise: Exercise) => {
      if (editingBuiltinExercise) {
         onExercisesSelect(selectedExercises.map(e => e.id === editingBuiltinExercise.id ? generatedExercise : e));
      } else {
         onExercisesSelect([...selectedExercises, generatedExercise]);
      }
      setIsChordDialogOpen(false);
      setEditingBuiltinExercise(undefined);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className='space-y-8'>
      <div className='border-b border-white/5 pb-6 flex items-start justify-between gap-4'>
        <div>
          <h2 className='text-3xl font-black tracking-tighter text-zinc-100'>
            {t("exercises:my_plans.create_dialog.exercises")}
          </h2>
          <p className='text-sm text-zinc-500 font-medium max-w-md leading-relaxed mt-1'>
            {t("exercises:my_plans.create_dialog.select_exercises_description")}
          </p>
        </div>
        <Button
          onClick={onNext}
          disabled={selectedExercises.length === 0}
          className="shrink-0 flex items-center gap-2 h-11 px-6 bg-white text-black hover:bg-zinc-200 rounded-[8px] font-bold tracking-widest transition-all disabled:opacity-40">
          Next step
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-5 lg:sticky top-6 min-w-0 flex flex-col gap-4">
          <div className="hidden lg:flex flex-wrap gap-2">
            {[
              { label: "Create Scale Exercise",  onClick: handleCreateScaleOpen,  cls: "border-indigo-500/30 bg-indigo-950/40 text-indigo-300 hover:border-indigo-400/60 hover:bg-indigo-950/60 hover:text-indigo-200" },
              { label: "Create Chord Exercise",  onClick: handleCreateChordOpen,  cls: "border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:border-emerald-400/60 hover:bg-emerald-950/60 hover:text-emerald-200" },
              { label: "Create Custom Exercise", onClick: handleCreateCustomOpen, cls: "border-zinc-600/40 bg-zinc-900/40 text-zinc-400 hover:border-zinc-500/60 hover:bg-zinc-800/50 hover:text-zinc-200" },
            ].map(({ label, onClick, cls }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className={`inline-flex items-center gap-2 h-8 px-3 rounded-[8px] border text-xs font-bold tracking-tight transition-all ${cls}`}
              >
                <FaPlus className="h-2.5 w-2.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>

          <SelectedExercisesList
            selectedExercises={selectedExercises}
            onToggleExercise={handleExerciseToggle}
            onEditExercise={handleEditExercise}
            onCloneExercise={handleCloneExercise}
            onEditTimeRequest={handleEditTimeRequest}
            onReorder={handleReorder}
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
            selectedSkill={selectedSkill}
            onSkillChange={setSelectedSkill}
            availableSkills={availableSkills}
            groupedExercises={groupedExercises}
          />

          <div className="flex lg:hidden flex-wrap gap-2">
            {[
              { label: "Create Scale Exercise",  onClick: handleCreateScaleOpen,  cls: "border-indigo-500/30 bg-indigo-950/40 text-indigo-300 hover:border-indigo-400/60 hover:bg-indigo-950/60 hover:text-indigo-200" },
              { label: "Create Chord Exercise",  onClick: handleCreateChordOpen,  cls: "border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:border-emerald-400/60 hover:bg-emerald-950/60 hover:text-emerald-200" },
              { label: "Create Custom Exercise", onClick: handleCreateCustomOpen,             cls: "border-zinc-600/40 bg-zinc-900/40 text-zinc-400 hover:border-zinc-500/60 hover:bg-zinc-800/50 hover:text-zinc-200" },
            ].map(({ label, onClick, cls }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className={`inline-flex items-center gap-2 h-8 px-3 rounded-lg border text-xs font-bold tracking-tight transition-all ${cls}`}
              >
                <FaPlus className="h-2.5 w-2.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>

          <ExerciseGrid
            exercises={filteredExercises}
            selectedExercises={selectedExercises}
            onToggleExercise={handleExerciseToggleWithTimeModal}
            onPreviewExercise={setPreviewingExercise}
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

      <AddExerciseTimeDialog
        exercise={pendingExercise ?? null}
        onConfirm={handleTimeConfirm}
        onCancel={() => setPendingExercise(undefined)}
      />

      <ExercisePreviewDialog
        exercise={previewingExercise ?? null}
        isSelected={selectedExercises.some(e => e.id === previewingExercise?.id)}
        onToggleExercise={handleExerciseToggleWithTimeModal}
        onClose={() => setPreviewingExercise(undefined)}
      />

      <ScaleSelectionDialog
        isOpen={isScaleDialogOpen}
        onClose={() => setIsScaleDialogOpen(false)}
        onExerciseGenerated={handleScaleGenerated}
        initialExercise={editingBuiltinExercise}
      />

      <ChordSelectionDialog
        isOpen={isChordDialogOpen}
        onClose={() => setIsChordDialogOpen(false)}
        onExerciseGenerated={handleChordGenerated}
        initialExercise={editingBuiltinExercise}
      />
    </motion.div>
  );
};
