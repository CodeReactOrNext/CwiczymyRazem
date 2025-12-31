import { increaseTimerTime } from 'feature/user/store/userSlice';
import type { useTimerInterface } from 'hooks/useTimer';
import { useEffect, useRef, useState } from 'react';
import { useAppDispatch } from 'store/hooks';
import type { SkillsType } from 'types/skillsTypes';

export const useTimeTracking = (timer: useTimerInterface, currentExercise: any) => {
  const dispatch = useAppDispatch();
  const lastTickRef = useRef<number | null>(null);
  const [exerciseTimeSpent, setExerciseTimeSpent] = useState(0);

  // Reset exercise-specific time when the exercise changes
  useEffect(() => {
    setExerciseTimeSpent(0);
    lastTickRef.current = null;
  }, [currentExercise.id]);

  useEffect(() => {
    if (!timer.timerEnabled) {
      lastTickRef.current = null;
      return;
    }

    // Initialize the tick if it's the first time the timer starts
    if (lastTickRef.current === null) {
      lastTickRef.current = Date.now();
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - (lastTickRef.current || now);

      if (delta >= 1000) {
        const skillType = currentExercise.category as SkillsType;

        dispatch(
          increaseTimerTime({
            type: skillType,
            time: delta,
          })
        );

        setExerciseTimeSpent(prev => prev + delta);
        lastTickRef.current = now;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timer.timerEnabled, currentExercise.category, currentExercise.id, dispatch]);

  return { exerciseTimeSpent };
}; 