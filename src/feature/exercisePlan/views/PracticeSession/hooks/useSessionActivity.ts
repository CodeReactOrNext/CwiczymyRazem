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
        })
      );
    }

    return () => {
      dispatch(setActivity(null));
    };
  }, [userAuth, currentExercise, plan, dispatch]);
};
