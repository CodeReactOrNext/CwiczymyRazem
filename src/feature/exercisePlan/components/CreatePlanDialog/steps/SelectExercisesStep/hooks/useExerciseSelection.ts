import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { useMemo, useState } from "react";

interface UseExerciseSelectionProps {
  selectedExercises: Exercise[];
  onExercisesSelect: (exercises: Exercise[]) => void;
  /* Removed currentLang */
}

interface UseExerciseSelectionReturn {
  searchQuery: string;
  selectedCategory: string;
  selectedDifficulty: string;
  groupedExercises: Record<string, Exercise[]>;
  filteredExercises: Exercise[];
  handleExerciseToggle: (exercise: Exercise) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedDifficulty: (difficulty: string) => void;
}

export const useExerciseSelection = ({
  selectedExercises,
  onExercisesSelect,
  /* Removed currentLang */
}: UseExerciseSelectionProps): UseExerciseSelectionReturn => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter out the configurable templates - they have dedicated buttons in the creator
  const exercises = exercisesAgregat.filter(ex =>
    ex.id !== 'scale_practice_configurable' &&
    ex.id !== 'chord_practice_configurable'
  );

  const groupedExercises = useMemo(() => {
    return exercises.reduce((acc, exercise) => {
      const category = exercise.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(exercise);
      return acc;
    }, {} as Record<string, Exercise[]>);
  }, [exercises]);

  const handleExerciseToggle = (exercise: Exercise) => {
    if (selectedExercises.find((e) => e.id === exercise.id)) {
      onExercisesSelect(selectedExercises.filter((e) => e.id !== exercise.id));
    } else {
      onExercisesSelect([...selectedExercises, exercise]);
    }
  };

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesSearch = exercise.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || exercise.category === selectedCategory;

      const matchesDifficulty =
        selectedDifficulty === "all" || exercise.difficulty === selectedDifficulty;

      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [exercises, searchQuery, selectedCategory, selectedDifficulty]);

  return {
    searchQuery,
    selectedCategory,
    selectedDifficulty,
    groupedExercises,
    filteredExercises,
    handleExerciseToggle,
    setSearchQuery,
    setSelectedCategory,
    setSelectedDifficulty,
  };
};
