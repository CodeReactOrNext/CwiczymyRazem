import { useCallback,  } from 'react';
import { useTranslation } from 'react-i18next';

import { useExerciseTimer } from '../../../hooks/useExerciseTimer';
import type { ExercisePlan, LocalizedContent } from '../../../types/exercise.types';
import { useExerciseNavigation } from './useExerciseNavigation';
import { useTimeTracking } from './useTimeTracking';
import { useUIState } from './useUIState';

interface UsePracticeSessionStateProps {
  plan: ExercisePlan;
  onFinish?: () => void;
}

export const usePracticeSessionState = ({ plan, onFinish }: UsePracticeSessionStateProps) => {
  const { i18n } = useTranslation(['exercises', 'common']);
  const currentLang = i18n.language as keyof LocalizedContent;
  
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
    isFullscreen,
    setIsFullscreen,
    showCompleteDialog,
    setShowCompleteDialog,
    isMobileView,
    isFullSessionModalOpen, 
    setIsFullSessionModalOpen,
    isImageModalOpen,
    setIsImageModalOpen,
    isMounted,
    toggleFullscreen
  } = useUIState();
  
  const {
    timeLeft,
    isPlaying,
    start: startTimer,
    pause: pauseTimer,
    reset: resetTimer,
  } = useExerciseTimer({
    duration: currentExercise.timeInMinutes * 60,
    onComplete: () => {
      if (isLastExercise) {
        setShowCompleteDialog(true);
      } else {
        setExerciseKey((prev) => prev + 1);
        setCurrentExerciseIndex((prev) => prev + 1);
      }
    },
  });
  
  useTimeTracking(currentExercise);

  const handleExerciseComplete = useCallback(() => {
    setShowCompleteDialog(true);
  }, [setShowCompleteDialog]);

  const completeHandleNextExercise = useCallback(() => {
    if (isLastExercise) {
      handleExerciseComplete();
    } else {
      handleNextExercise(resetTimer);
    }
  }, [isLastExercise, handleExerciseComplete, handleNextExercise, resetTimer]);

  const toggleTimer = useCallback(() => {
    if (isPlaying) {
      pauseTimer();
    } else {
      startTimer();
    }
  }, [isPlaying, pauseTimer, startTimer]);


  const formattedTimeLeft = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`;
  const timerProgressValue = (timeLeft / (currentExercise.timeInMinutes * 60)) * 100;

  return {
    currentExerciseIndex,
    exerciseKey,
    isFullscreen,
    showCompleteDialog,
    isMobileView,
    isFullSessionModalOpen,
    isImageModalOpen,
    isMounted,
    
    currentExercise,
    nextExercise,
    isLastExercise,
    
    timeLeft,
    isPlaying,
    formattedTimeLeft,
    timerProgressValue,
    
    setCurrentExerciseIndex,
    setIsFullscreen,
    setShowCompleteDialog,
    setIsFullSessionModalOpen,
    setIsImageModalOpen,
    handleExerciseComplete,
    handleNextExercise: completeHandleNextExercise,
    toggleTimer,
    toggleFullscreen,
    startTimer,
    pauseTimer,
    resetTimer,
    currentLang,
    plan
  };
}; 