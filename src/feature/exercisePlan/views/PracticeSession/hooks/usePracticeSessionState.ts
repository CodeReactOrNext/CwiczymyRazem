import useTimer from 'hooks/useTimer';

import type { ExercisePlan } from '../../../types/exercise.types';
import { useExerciseNavigation } from './useExerciseNavigation';
import { useTimeTracking } from './useTimeTracking';
import { useUIState } from './useUIState';

interface UsePracticeSessionStateProps {
  plan: ExercisePlan;
}

export const usePracticeSessionState = ({ plan }: UsePracticeSessionStateProps) => {
  const {
    currentExerciseIndex,
    setCurrentExerciseIndex,
    exerciseKey,
    setExerciseKey,
    currentExercise,
    nextExercise,
    isLastExercise,
    handleNextExercise
  } = useExerciseNavigation(plan);
  
  const {
    showCompleteDialog,
    setShowCompleteDialog,
    isMobileView,
    isFullSessionModalOpen, 
    isImageModalOpen,
    setIsImageModalOpen,
    isMounted,
  } = useUIState();
  
  const timer = useTimer();
  

  
  useTimeTracking(currentExercise);



  const toggleTimer = () => {
    if (timer.timerEnabled) {
     timer.stopTimer();
    } else { 
      timer.startTimer();
    }
  }

  const timeLeft = Math.max(0, Math.floor((currentExercise.timeInMinutes * 60 * 1000 - timer.time) / 1000));
  const formattedTimeLeft = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`;
  const timerProgressValue = (timer.time / (currentExercise.timeInMinutes * 60)) * 100;

  return {
    currentExerciseIndex,
    exerciseKey,
    showCompleteDialog,
    isMobileView,
    isFullSessionModalOpen,
    isImageModalOpen,
    isMounted,
    currentExercise,
    nextExercise,
    isLastExercise,
    isPlaying: timer.timerEnabled,
    timeLeft,
    formattedTimeLeft,
    timerProgressValue,
    setShowCompleteDialog,
    setIsImageModalOpen,
    handleNextExercise,
    toggleTimer,
    startTimer: timer.startTimer,
    resetTimer: timer.restartTime,
  };
}; 