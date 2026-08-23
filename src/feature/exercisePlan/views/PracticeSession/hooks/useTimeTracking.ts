import { increaseTimerTime } from 'feature/user/store/userSlice';
import type { useTimerInterface } from 'hooks/useTimer';
import { useEffect, useRef } from 'react';
import { useAppDispatch } from 'store/hooks';
import type { SkillsType } from 'types/skillsTypes';

import { useSessionTimeStore } from './sessionTimeStore';

export const useTimeTracking = (timer: useTimerInterface, currentExercise: any) => {
  const dispatch = useAppDispatch();
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    lastTickRef.current = null;
  }, [currentExercise.id]);

  useEffect(() => {
    if (!timer.timerEnabled) {
      lastTickRef.current = null;
      return;
    }

    if (lastTickRef.current === null) {
      lastTickRef.current = Date.now();
    }

    let skillType = currentExercise.category as SkillsType;

    if (skillType === "mixed" as any || !skillType) {
      skillType = "technique";
    }

    const flush = () => {
      const now = Date.now();
      const delta = now - (lastTickRef.current ?? now);

      if (delta > 0) {
        dispatch(
          increaseTimerTime({
            type: skillType,
            time: delta,
          })
        );
        // The same tick, kept session-scoped — this is what gets reported, so
        // time left over in Redux from an earlier, unreported session cannot
        // leak into this session's category split.
        useSessionTimeStore.getState().add(skillType, delta);

        lastTickRef.current = now;
      }
    };

    const interval = setInterval(() => {
      const now = Date.now();

      if (now - (lastTickRef.current || now) >= 1000) {
        flush();
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      // flush the partial second so it isn't lost on pause/exercise change/finish
      flush();
    };
  }, [timer.timerEnabled, currentExercise.category, currentExercise.id, dispatch]);

  return {};
};
