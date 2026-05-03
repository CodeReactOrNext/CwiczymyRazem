import { selectCurrentUserStats, selectPreviousUserStats, selectTimerData, selectUserAuth } from 'feature/user/store/userSlice';
import useTimer from 'hooks/useTimer';
import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from 'store/hooks';

import type { ExercisePlan } from '../../../types/exercise.types';
import { useExerciseNavigation } from './useExerciseNavigation';
import { useExerciseTimerSync } from './useExerciseTimerSync';
import { useSessionActivity } from './useSessionActivity';
import { useSessionProgress } from './useSessionProgress';
import { useSessionReporting } from './useSessionReporting';
import { useSessionTimerLogic } from './useSessionTimerLogic';
import { useTimeTracking } from './useTimeTracking';
import { useUIState } from './useUIState';

interface UsePracticeSessionStateProps {
  plan: ExercisePlan;
  onFinish?: () => void;
  autoReport?: boolean;
  forceFullDuration?: boolean;
  freeMode?: boolean;
  skillRewardSkillId?: string;
  skillRewardAmount?: number;
}

export const usePracticeSessionState = ({
  plan,
  onFinish,
  forceFullDuration,
  freeMode,
  skillRewardSkillId,
}: UsePracticeSessionStateProps) => {
  const userAuth = useAppSelector(selectUserAuth);
  const timerData = useAppSelector(selectTimerData);
  const currentUserStats = useAppSelector(selectCurrentUserStats);
  const previousUserStats = useAppSelector(selectPreviousUserStats);
  const avatar = useAppSelector((state) => state.user.userInfo?.avatar);

  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const {
    currentExerciseIndex,
    setCurrentExerciseIndex,
    exerciseKey,
    currentExercise,
    nextExercise,
    isLastExercise,
    handleNextExercise: baseHandleNextExercise,
  } = useExerciseNavigation(plan);

  const {
    showCompleteDialog,
    setShowCompleteDialog,
    isMobileView,
    isFullSessionModalOpen,
    isMounted,
  } = useUIState();

  const timer = useTimer();
  useTimeTracking(timer, currentExercise);

  const isSkillExercise = !!skillRewardSkillId || !!forceFullDuration;

  const duration = videoDuration !== null ? videoDuration : (currentExercise.timeInMinutes || 0) * 60;

  const {
    completedExercises,
    showSuccessView,
    setShowSuccessView,
    canFinishSession,
    resetProgress,
  } = useSessionProgress({
    timer,
    duration,
    currentExerciseIndex,
    isLastExercise,
    freeMode,
    isSkillExercise,
  });


  const { isSubmittingReport, reportResult, handleFinishSession, activityDataToUse, resetReporting } =
    useSessionReporting({
      plan,
      avatar: avatar || null,
      completedExercises,
    });

  useSessionActivity({
    userAuth,
    plan,
    currentExercise,
  });

  const { exerciseTimes, saveTime, getTime, resetExerciseTimes } = useExerciseTimerSync();

  const toggleTimer = (metronomeToggle?: () => void) => {
    if (timer.timerEnabled) {
      timer.stopTimer();
      if (metronomeToggle) metronomeToggle();
    } else {
      timer.startTimer();
      if (metronomeToggle) metronomeToggle();
    }
  };

  const restartFullSession = useCallback(() => {
    resetReporting();
    resetProgress();
    resetExerciseTimes();
    setCurrentExerciseIndex(0);
    timer.restartTime();
  }, [timer, setCurrentExerciseIndex, resetReporting, resetProgress, resetExerciseTimes]);

  const handleNextExercise = useCallback((resetTimerFn: () => void) => {
    saveTime(currentExerciseIndex, timer.getTime());

    baseHandleNextExercise(() => {
      const nextIndex = currentExerciseIndex + 1;
      if (nextIndex < plan.exercises.length) {
        const savedTime = getTime(nextIndex);
        timer.setInitialStartTime(savedTime || 0);
      } else {
        resetTimerFn();
      }
    }, onFinish);
  }, [currentExerciseIndex, timer, saveTime, getTime, baseHandleNextExercise, plan.exercises.length, onFinish]);

  const jumpToExercise = (index: number) => {
    saveTime(currentExerciseIndex, timer.getTime());
    const savedTime = getTime(index);
    timer.setInitialStartTime(savedTime || 0);
    setCurrentExerciseIndex(index);
  };

  const planTitleString = typeof plan.title === 'string' ? plan.title : plan.title;


  return {
    currentExerciseIndex,
    exerciseKey,
    showCompleteDialog,
    isMobileView,
    isFullSessionModalOpen,
    isMounted,
    currentExercise,
    nextExercise,
    isLastExercise,
    isPlaying: timer.timerEnabled,
    setShowCompleteDialog,
    handleNextExercise,
    toggleTimer,
    startTimer: timer.startTimer,
    stopTimer: timer.stopTimer,
    resetTimer: timer.restartTime,
    setTimerTime: timer.setInitialStartTime,
    showSuccessView,
    setShowSuccessView,
    restartFullSession,
    resetSuccessView: () => setShowSuccessView(false),
    setVideoDuration,
    videoDuration,
    autoSubmitReport: (
      exerciseRecords?: any,
      micPerformance?: any,
      earTrainingPerformance?: any
    ) => handleFinishSession(timerData, timer.stopTimer, exerciseRecords, micPerformance, earTrainingPerformance),
    canSkipExercise: true,
    canFinishSession,
    isSkillExercise,
    isSubmittingReport,
    completedExercises,
    reportResult,
    currentUserStats,
    previousUserStats,
    planTitleString,
    sessionTimerData: timerData,
    activityDataToUse,
    jumpToExercise,
    timer,
  };
};