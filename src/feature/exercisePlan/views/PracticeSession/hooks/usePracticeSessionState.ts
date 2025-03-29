import useTimer from 'hooks/useTimer';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  
  const timer = useTimer();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const durationRef = useRef(currentExercise.timeInMinutes * 60);
  const initialTimeRef = useRef(0);
  const [timeLeft, setTimeLeft] = useState(currentExercise.timeInMinutes * 60);
  
  useEffect(() => {
    durationRef.current = currentExercise.timeInMinutes * 60;
    setTimeLeft(currentExercise.timeInMinutes * 60);
    initialTimeRef.current = 0;
    timer.restartTime();
  }, [currentExercise.timeInMinutes, timer]);
  
  useEffect(() => {
    if (isPlaying) {
      const elapsedSeconds = Math.floor(timer.time / 1000);
      const newTimeLeft = Math.max(0, durationRef.current - elapsedSeconds);
      
      if (newTimeLeft !== timeLeft) {
        setTimeLeft(newTimeLeft);
        
        if (newTimeLeft <= 0) {
          setIsPlaying(false);
          timer.stopTimer();
          
          if (isLastExercise) {
            setShowCompleteDialog(true);
          } else {
            setExerciseKey((prev) => prev + 1);
            setCurrentExerciseIndex((prev) => prev + 1);
          }
        }
      }
    }
  }, [timer.time, isPlaying, timeLeft, isLastExercise, setShowCompleteDialog, setExerciseKey, setCurrentExerciseIndex]);
  
  const startTimer = useCallback(() => {
    setIsPlaying(true);
    timer.startTimer();
  }, [timer]);
  
  const pauseTimer = useCallback(() => {
    setIsPlaying(false);
    timer.stopTimer();
  }, [timer]);
  
  const resetTimer = useCallback(() => {
    setIsPlaying(false);
    timer.restartTime();
    setTimeLeft(durationRef.current);
  }, [timer]);
  
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