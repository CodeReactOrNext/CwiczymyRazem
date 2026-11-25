import { useEffect, useState } from "react";

import type { Exercise } from "../../../types/exercise.types";

/**
 * Configurable scale/chord practice ships without a tab — the setup dialog
 * generates one — so anything deciding up front whether a session has a tab
 * (default guitar playback, the mic prompt) has to count these as having one.
 */
export const willHaveTablature = (exercise: Exercise): boolean =>
  exercise.id === "scale_practice_configurable" ||
  exercise.id === "chord_practice_configurable" ||
  !!exercise.tablature?.length;

interface UseGeneratedExerciseOptions {
  currentExercise: Exercise;
  /** Where the plan is — a plan may hold the same configurable exercise twice. */
  exerciseIndex: number;
}

export function useGeneratedExercise({ currentExercise, exerciseIndex }: UseGeneratedExerciseOptions) {
  const [showScaleDialog,   setShowScaleDialog]   = useState(false);
  const [showChordDialog,   setShowChordDialog]   = useState(false);
  // Tied to the plan item it was set up for: without that, the generated tab
  // stayed on screen under the next exercise's title.
  const [generated, setGenerated] = useState<{ index: number; sourceId: string; exercise: Exercise } | null>(null);
  const generatedExercise =
    generated?.index === exerciseIndex && generated.sourceId === currentExercise.id ? generated.exercise : null;

  useEffect(() => {
    if (currentExercise.id === "scale_practice_configurable") {
      setShowScaleDialog(true);
      setShowChordDialog(false);
      setGenerated(null);
    } else if (currentExercise.id === "chord_practice_configurable") {
      setShowChordDialog(true);
      setShowScaleDialog(false);
      setGenerated(null);
    } else {
      setShowScaleDialog(false);
      setShowChordDialog(false);
    }
  }, [currentExercise.id, exerciseIndex]);

  const handleGenerated = (exercise: Exercise) => {
    setGenerated({ index: exerciseIndex, sourceId: currentExercise.id, exercise });
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
