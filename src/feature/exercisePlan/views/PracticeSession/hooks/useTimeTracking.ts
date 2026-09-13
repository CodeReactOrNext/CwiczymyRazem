import type { Exercise } from 'feature/exercisePlan/types/exercise.types';
import { increaseTimerTime } from 'feature/user/store/userSlice';
import type { useTimerInterface } from 'hooks/useTimer';
import { useEffect, useRef } from 'react';
import { useAppDispatch } from 'store/hooks';
import type { SkillsType } from 'types/skillsTypes';

import { useSessionTimeStore } from './sessionTimeStore';

type TrackedExercise = Pick<Exercise, 'id' | 'category' | 'songData'>;

export const useTimeTracking = (timer: useTimerInterface, currentExercise: TrackedExercise) => {
  const dispatch = useAppDispatch();
  const lastTickRef = useRef<number | null>(null);
  // A song item's ticks are also credited to the song itself (see
  // sessionTimeStore.songTime) — that is how a song inside a routine counts
  // towards the time spent with it, the same as the song timer does.
  const songId = currentExercise.songData?.songId;

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
        useSessionTimeStore.getState().add(skillType, delta, songId);

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
  }, [timer.timerEnabled, currentExercise.category, currentExercise.id, songId, dispatch]);

  return {};
};
