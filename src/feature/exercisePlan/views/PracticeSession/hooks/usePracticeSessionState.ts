import { updateTimerTime } from 'feature/user/store/userSlice';
import useTimer from 'hooks/useTimer';
import { useCallback,useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from 'store/hooks';
import type { SkillsType } from 'types/skillsTypes';

import { useExerciseTimer } from '../../../hooks/useExerciseTimer';
import type { ExercisePlan, LocalizedContent } from '../../../types/exercise.types';

interface UsePracticeSessionStateProps {
  plan: ExercisePlan;
  onFinish?: () => void;
}

export const usePracticeSessionState = ({ plan, onFinish }: UsePracticeSessionStateProps) => {
  const { i18n } = useTranslation(['exercises', 'common']);
  const dispatch = useAppDispatch();
  const timer = useTimer();
  const currentLang = i18n.language as keyof LocalizedContent;
  
  // Session UI states
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [exerciseKey, setExerciseKey] = useState(0);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isFullSessionModalOpen, setIsFullSessionModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Derived state
  const currentExercise = plan.exercises[currentExerciseIndex];
  const nextExercise = plan.exercises[currentExerciseIndex + 1];
  const isLastExercise = currentExerciseIndex === plan.exercises.length - 1;

  // Timer setup
  const {
    timeLeft,
    isPlaying,
    start: startTimer,
    pause: pauseTimer,
    reset: resetTimer,
  } = useExerciseTimer({
    duration: currentExercise.timeInMinutes * 60,
    onComplete: () => {
      console.log("🎯 Timer onComplete callback triggered");
      if (isLastExercise) {
        console.log("📋 Last exercise completed - showing completion dialog");
        setShowCompleteDialog(true);
      } else {
        console.log("⏭️ Moving to next exercise");
        setExerciseKey((prev) => prev + 1);
        setCurrentExerciseIndex((prev) => prev + 1);
      }
    },
  });

  // Handle exercise completion
  const handleExerciseComplete = useCallback(() => {
    setShowCompleteDialog(true);
  }, []);

  // Handle moving to next exercise
  const handleNextExercise = useCallback(() => {
    if (currentExerciseIndex < plan.exercises.length - 1) {
      setExerciseKey((prev) => prev + 1);
      setCurrentExerciseIndex((prev) => prev + 1);
      resetTimer();
    } else {
      handleExerciseComplete();
    }
  }, [currentExerciseIndex, plan.exercises.length, resetTimer, handleExerciseComplete]);

  // Toggle timer play/pause
  const toggleTimer = useCallback(() => {
    console.log(
      `🔄 Toggle timer called - current state: ${
        isPlaying ? "PLAYING" : "PAUSED"
      }`
    );
    if (isPlaying) {
      console.log("⏸️ Pausing timer");
      pauseTimer();
    } else {
      console.log("▶️ Starting timer");
      startTimer();
    }
  }, [isPlaying, pauseTimer, startTimer]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Log timer changes for debugging
  useEffect(() => {
    console.log(
      `📊 PracticeSession component sees timeLeft: ${timeLeft} (${Math.floor(
        timeLeft / 60
      )}:${String(timeLeft % 60).padStart(2, "0")})`
    );
  }, [timeLeft]);

  // Auto start the timer when exercise changes
  useEffect(() => {
    console.log(
      `🔄 Exercise changed to index ${currentExerciseIndex}, resetting timer`
    );
    console.log(
      `📊 New exercise duration: ${currentExercise.timeInMinutes * 60} seconds`
    );

    resetTimer();

    // Give a small delay to ensure the reset has completed
    const startTimeout = setTimeout(() => {
      console.log("▶️ Starting timer after exercise change (with delay)");
      startTimer();
    }, 100);

    return () => clearTimeout(startTimeout);
  }, [

  ]);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);

      // Automatically open full session modal on mobile
      if (isMobile && !isFullSessionModalOpen) {
        setIsFullSessionModalOpen(true);
      } else if (!isMobile && isFullSessionModalOpen) {
        setIsFullSessionModalOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, [isFullSessionModalOpen]);

  // Client-side initialization
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Track time spent practicing
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

  // Start the practice timer on mount
  useEffect(() => {
    timer.startTimer();
    return () => {
      updateTime();
      timer.stopTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update skill time tracking when timer changes
  useEffect(() => {
    if (!timer.timerEnabled) return;
    updateTime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.time]);

  // Format timer text and calculate progress
  const formattedTimeLeft = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`;
  const timerProgressValue = (timeLeft / (currentExercise.timeInMinutes * 60)) * 100;

  return {
    // Session state
    currentExerciseIndex,
    exerciseKey,
    isFullscreen,
    showCompleteDialog,
    isMobileView,
    isFullSessionModalOpen,
    isImageModalOpen,
    isMounted,
    
    // Exercise data
    currentExercise,
    nextExercise,
    isLastExercise,
    
    // Timer state
    timeLeft,
    isPlaying,
    formattedTimeLeft,
    timerProgressValue,
    
    // Actions
    setCurrentExerciseIndex,
    setIsFullscreen,
    setShowCompleteDialog,
    setIsFullSessionModalOpen,
    setIsImageModalOpen,
    handleExerciseComplete,
    handleNextExercise,
    toggleTimer,
    toggleFullscreen,
    startTimer,
    pauseTimer,
    resetTimer,
    
    // Other
    currentLang,
    plan
  };
}; 