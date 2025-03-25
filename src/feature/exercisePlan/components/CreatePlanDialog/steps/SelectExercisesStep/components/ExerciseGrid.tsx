import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { ExerciseCard } from "./ExerciseCard";

interface ExerciseGridProps {
  exercises: Exercise[];
  selectedExercises: Exercise[];
  onToggleExercise: (exercise: Exercise) => void;
  currentLang: "pl" | "en";
}

export const ExerciseGrid = ({
  exercises,
  selectedExercises,
  onToggleExercise,
  currentLang,
}: ExerciseGridProps) => {
  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
      {exercises.map((exercise) => {
        const isSelected = selectedExercises.some(
          (e) => e.id === exercise.id
        );

        return (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            isSelected={isSelected}
            onToggle={onToggleExercise}
            currentLang={currentLang}
          />
        );
      })}
    </div>
  );
}; 