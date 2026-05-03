import { useCallback, useState } from 'react';

export const useExerciseTimerSync = () => {
  const [exerciseTimes, setExerciseTimes] = useState<Record<number, number>>({});

  const saveTime = useCallback((index: number, time: number) => {
    setExerciseTimes((prev) => ({
      ...prev,
      [index]: time,
    }));
  }, []);

  const getTime = useCallback((index: number) => {
    return exerciseTimes[index] || 0;
  }, [exerciseTimes]);

  const resetExerciseTimes = useCallback(() => {
    setExerciseTimes({});
  }, []);

  return {
    exerciseTimes,
    saveTime,
    getTime,
    resetExerciseTimes,
  };
};
