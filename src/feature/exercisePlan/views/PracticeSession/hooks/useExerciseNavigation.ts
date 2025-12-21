import { useCallback, useState } from 'react';

import type { ExercisePlan } from '../../../types/exercise.types';

export const useExerciseNavigation = (plan: ExercisePlan) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseKey, setExerciseKey] = useState(0);

  const currentExercise = plan.exercises[currentExerciseIndex];
  const nextExercise = currentExerciseIndex < plan.exercises.length - 1
    ? plan.exercises[currentExerciseIndex + 1]
    : null;

  const isLastExercise = currentExerciseIndex === plan.exercises.length - 1;

  const handleNextExercise = useCallback((resetTimerFn: () => void, onFinish?: () => void) => {
    if (currentExerciseIndex < plan.exercises.length - 1) {
      setExerciseKey((prev) => prev + 1);
      setCurrentExerciseIndex((prev) => prev + 1);
      resetTimerFn();
    } else if (onFinish) {
      onFinish();
    }
  }, [currentExerciseIndex, plan.exercises.length]);

  return {
    currentExerciseIndex,
    setCurrentExerciseIndex,
    exerciseKey,
    setExerciseKey,
    currentExercise,
    nextExercise,
    isLastExercise,
    handleNextExercise
  };
}; 