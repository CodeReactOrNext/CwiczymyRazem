import { selectUserAuth, setActivity } from 'feature/user/store/userSlice';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'store/hooks';

import type { Exercise, ExercisePlan } from '../../../types/exercise.types';

interface UseSessionActivityProps {
  plan: ExercisePlan;
  currentExercise: Exercise;
}

export const useSessionActivity = ({ plan, currentExercise }: UseSessionActivityProps) => {
  const dispatch = useAppDispatch();
  const userAuth = useAppSelector(selectUserAuth);


  useEffect(() => {
    if (userAuth) {
      dispatch(
        setActivity({
          planTitle: typeof plan.title === 'string' ? plan.title : plan.title,
          exerciseTitle: currentExercise.title,
          category: currentExercise.category,
          timestamp: Date.now(),
          // What lets the "Live now" row open this session for someone else. A song wrapper is
          // opened through its song; anything else through its plan and exercises.
          planId: plan.id,
          exerciseId: currentExercise.id,
          ...(plan.song
            ? { songId: plan.song.id }
            : { exerciseIds: plan.exercises.map((exercise) => exercise.id) }),
        })
      );
    }

    return () => {
      dispatch(setActivity(null));
    };
  }, [userAuth, currentExercise, plan, dispatch]);
};
