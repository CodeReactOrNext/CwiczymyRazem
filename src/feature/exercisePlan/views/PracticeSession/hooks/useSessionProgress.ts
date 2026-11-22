import type { useTimerInterface } from 'hooks/useTimer';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSessionProgressProps {
  timer: useTimerInterface;
  currentExerciseIndex: number;
  isLastExercise: boolean;
  duration: number;
  freeMode?: boolean;
  onTimeUp?: () => void;
}

export const useSessionProgress = ({
  timer,
  currentExerciseIndex,
  isLastExercise,
  duration,
  freeMode,
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

  // The floor under any finish: at least one exercise got the 20s that make it
  // count as practised, so a finish can never write an empty report.
  const hasLoggedPractice = completedExercises.length > 0;

  // One rule for every route (owner, 2026-11-22): a session counts in full only
  // once it is played out — its last exercise ran its clock down. Anything
  // sooner is an early finish (time only), whether the exercise came from a
  // plan, the catalog, the daily widget or a skill. An item with no clock of
  // its own has nothing to play out, so its 20 s are the bar.
  const hasClock = !freeMode && duration > 0;
  const canFinishSession = freeMode
    ? hasLoggedPractice
    : isLastExercise && (hasClock ? currentTimeLeft <= 0 : hasLoggedPractice);

  /** Whether the exercise on screen ran its clock down — what its scores,
   *  records and leaderboard entry are saved for when the player moves on. */
  const isCurrentExercisePlayedOut = useCallback(() => {
    if (freeMode || duration <= 0) return true;
    return Math.floor((duration * 1000 - timer.getTime()) / 1000) <= 0;
  }, [freeMode, duration, timer]);

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
    hasLoggedPractice,
    isCurrentExercisePlayedOut,
    resetProgress,
    setCompletedExercises,
  };
};
