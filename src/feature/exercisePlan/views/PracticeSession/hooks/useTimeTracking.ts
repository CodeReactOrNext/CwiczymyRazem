import { updateTimerTime } from 'feature/user/store/userSlice';
import useTimer from 'hooks/useTimer';
import { useCallback, useEffect } from 'react';
import { useAppDispatch } from 'store/hooks';
import type { SkillsType } from 'types/skillsTypes';

export const useTimeTracking = (currentExercise: any) => {
  const dispatch = useAppDispatch();
  const timer = useTimer();
  
  const updateTime = useCallback(() => {
    const timeInMs = timer.time;
    if (timeInMs > 0) {
      const skillType = currentExercise.category as SkillsType;

      dispatch(
        updateTimerTime({
          type: skillType,
          time: timeInMs,
        })
      );
    }
  }, [currentExercise.category, dispatch, timer.time]);

  useEffect(() => {
    timer.startTimer();
    
    return () => {
      updateTime();
      timer.stopTimer();
    };
  }, []);

  useEffect(() => {
    if (!timer.timerEnabled) return;
    updateTime();
  }, [timer.time, timer.timerEnabled, updateTime]);
  
  return { updateTime };
}; 