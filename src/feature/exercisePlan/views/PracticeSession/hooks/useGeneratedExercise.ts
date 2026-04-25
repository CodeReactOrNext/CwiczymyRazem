import { useEffect, useState } from "react";

import type { Exercise } from "../../../types/exercise.types";

interface UseGeneratedExerciseOptions {
  currentExercise: Exercise;
}

export function useGeneratedExercise({ currentExercise }: UseGeneratedExerciseOptions) {
  const [showScaleDialog,   setShowScaleDialog]   = useState(false);
  const [showChordDialog,   setShowChordDialog]   = useState(false);
  const [generatedExercise, setGeneratedExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    if (currentExercise.id === "scale_practice_configurable") {
      setShowScaleDialog(true);
      setShowChordDialog(false);
      setGeneratedExercise(null);
    } else if (currentExercise.id === "chord_practice_configurable") {
      setShowChordDialog(true);
      setShowScaleDialog(false);
      setGeneratedExercise(null);
    } else {
      setShowScaleDialog(false);
      setShowChordDialog(false);
    }
  }, [currentExercise.id]);

  const handleGenerated = (exercise: Exercise) => {
    setGeneratedExercise(exercise);
    setShowScaleDialog(false);
    setShowChordDialog(false);
  };

  const activeExercise = generatedExercise || currentExercise;

  return {
    showScaleDialog,
    setShowScaleDialog,
    showChordDialog,
    setShowChordDialog,
    generatedExercise,
    activeExercise,
    handleGenerated,
  };
}
