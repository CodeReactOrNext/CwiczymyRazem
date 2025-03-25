import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { useMemo, useState } from "react";

interface UseExerciseSelectionProps {
  selectedExercises: Exercise[];
  onExercisesSelect: (exercises: Exercise[]) => void;
  currentLang: "pl" | "en";
}

interface UseExerciseSelectionReturn {
  searchQuery: string;
  selectedCategory: string;
  groupedExercises: Record<string, Exercise[]>;
  filteredExercises: Exercise[];
  handleExerciseToggle: (exercise: Exercise) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
}

export const useExerciseSelection = ({
  selectedExercises,
  onExercisesSelect,
  currentLang,
}: UseExerciseSelectionProps): UseExerciseSelectionReturn => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const exercises = exercisesAgregat;
  
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
      const matchesSearch = exercise.title[currentLang]
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || exercise.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [exercises, searchQuery, selectedCategory, currentLang]);

  return {
    searchQuery,
    selectedCategory,
    groupedExercises,
    filteredExercises,
    handleExerciseToggle,
    setSearchQuery,
    setSelectedCategory,
  };
}; 