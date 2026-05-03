import { setActivity } from 'feature/user/store/userSlice';
import { useEffect } from 'react';
import { useAppDispatch } from 'store/hooks';

import type { Exercise, ExercisePlan } from '../../../types/exercise.types';

interface UseSessionActivityProps {
  userAuth: string | null;
  plan: ExercisePlan;
  currentExercise: Exercise;
}

export const useSessionActivity = ({ userAuth, plan, currentExercise }: UseSessionActivityProps) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (userAuth) {
      dispatch(
        setActivity({
          planTitle: typeof plan.title === 'string' ? plan.title : plan.title,
          exerciseTitle: currentExercise.title,
          category: currentExercise.category,
          timestamp: Date.now(),
        })
      );
    }

    return () => {
      dispatch(setActivity(null));
    };
  }, [userAuth, currentExercise, plan, dispatch]);
};
