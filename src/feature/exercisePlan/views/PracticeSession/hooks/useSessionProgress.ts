import { useCallback, useEffect, useRef, useState } from 'react';

import type { useTimerInterface } from 'hooks/useTimer';

interface UseSessionProgressProps {
  timer: useTimerInterface;
  currentExerciseIndex: number;
  isLastExercise: boolean;
  duration: number;
  freeMode?: boolean;
  isSkillExercise: boolean;
  onTimeUp?: () => void;
}

export const useSessionProgress = ({
  timer,
  currentExerciseIndex,
  isLastExercise,
  duration,
  freeMode,
  isSkillExercise,
  onTimeUp,
}: UseSessionProgressProps) => {
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [showSuccessView, setShowSuccessView] = useState(false);

  // Track whether timeLeft was ever > 0 (to avoid triggering success
  // for exercises with no duration, which have timeLeft=0 from the start)
  const timeLeftWasPositiveRef = useRef(false);

  // We no longer track timeLeft in a standalone effect because it doesn't trigger re-renders.
  // Instead, we evaluate everything inside the timer subscription.

  useEffect(() => {
    return timer.subscribe((time) => {
      const MIN_TIME_FOR_COMPLETION = 20000;
      
      // Update completion status
      if (time >= MIN_TIME_FOR_COMPLETION) {
        setCompletedExercises((prev) => {
          if (!prev.includes(currentExerciseIndex)) return [...prev, currentExerciseIndex];
          return prev;
        });
      }

      const effectiveDurationSeconds = freeMode ? Number.MAX_SAFE_INTEGER : duration;
      const currentTimeLeft = freeMode ? 0 : Math.max(0, Math.floor((effectiveDurationSeconds * 1000 - time) / 1000));
      
      if (currentTimeLeft > 0) {
        timeLeftWasPositiveRef.current = true;
      }

      // Check for success
      if (!freeMode && isLastExercise && currentTimeLeft <= 0 && timeLeftWasPositiveRef.current) {
        setShowSuccessView(true);
      }

      // Auto-stop when time is up
      if (!freeMode && effectiveDurationSeconds > 0 && currentTimeLeft <= 0 && timer.timerEnabled) {
        if (onTimeUp) onTimeUp();
      }
    });
  }, [timer, currentExerciseIndex, isLastExercise, duration, freeMode, onTimeUp]);

  // For canFinishSession, we just need to read the current time synchronously
  const time = timer.getTime();
  const effectiveDurationSeconds = freeMode ? Number.MAX_SAFE_INTEGER : duration;
  const currentTimeLeft = freeMode ? 0 : Math.max(0, Math.floor((effectiveDurationSeconds * 1000 - time) / 1000));

  const canFinishSession = freeMode
    ? completedExercises.length > 0
    : isSkillExercise
      ? currentTimeLeft <= 0 && timeLeftWasPositiveRef.current
      : completedExercises.length > 0;

  const resetProgress = useCallback(() => {
    setCompletedExercises([]);
    setShowSuccessView(false);
    timeLeftWasPositiveRef.current = false;
  }, []);

  return {
    completedExercises,
    showSuccessView,
    setShowSuccessView,
    canFinishSession,
    resetProgress,
    setCompletedExercises,
  };
};
