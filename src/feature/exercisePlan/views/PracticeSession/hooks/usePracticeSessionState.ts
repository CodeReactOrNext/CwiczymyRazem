import { selectCurrentUserStats, selectPreviousUserStats } from 'feature/user/store/userSlice';
import useTimer from 'hooks/useTimer';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from 'store/hooks';

import type { ExercisePlan } from '../../../types/exercise.types';
import { useSessionTimeStore } from './sessionTimeStore';
import { useExerciseNavigation } from './useExerciseNavigation';
import { useExerciseTimerSync } from './useExerciseTimerSync';
import { useSessionActivity } from './useSessionActivity';
import { useSessionProgress } from './useSessionProgress';
import { useSessionReporting } from './useSessionReporting';
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
  forceFullDuration,
  freeMode,
  skillRewardSkillId,
}: UsePracticeSessionStateProps) => {
  const currentUserStats = useAppSelector(selectCurrentUserStats);
  const previousUserStats = useAppSelector(selectPreviousUserStats);
  const avatar = useAppSelector((state) => state.user.userInfo?.avatar);

  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  // A fresh session starts from zero. Whatever the player left unreported
  // before (an abandoned drill, the Free Timer) stays in Redux and is theirs to
  // report later — it must not be folded into this session's category split.
  const resetSessionTime = useSessionTimeStore((state) => state.reset);
  useEffect(() => {
    resetSessionTime();
  }, [plan.id, resetSessionTime]);

  const {
    currentExerciseIndex,
    setCurrentExerciseIndex,
    exerciseKey,
    currentExercise,
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

  // A song item's slot stretches to its tab: an 8-minute song in a 5-minute
  // slot would be cut off mid-solo. Keyed by item, so it never outlives it.
  const [tabDuration, setTabDurationState] = useState<{ exerciseId: string; seconds: number } | null>(null);
  const setTabDuration = useCallback((exerciseId: string, seconds: number | null) => {
    setTabDurationState(seconds === null ? null : { exerciseId, seconds: Math.ceil(seconds) });
  }, []);
  const tabSeconds = tabDuration?.exerciseId === currentExercise.id ? tabDuration.seconds : 0;

  const duration = videoDuration !== null
    ? videoDuration
    : Math.max((currentExercise.timeInMinutes || 0) * 60, tabSeconds);

  const {
    completedExercises,
    showSuccessView,
    setShowSuccessView,
    canFinishSession,
    hasLoggedPractice,
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
    plan,
    currentExercise,
  });

  const { saveTime, getTime, resetExerciseTimes } = useExerciseTimerSync();



  const restartFullSession = useCallback(() => {
    resetReporting();
    resetProgress();
    resetExerciseTimes();
    resetSessionTime();
    setCurrentExerciseIndex(0);
    timer.restartTime();
  }, [timer, setCurrentExerciseIndex, resetReporting, resetProgress, resetExerciseTimes, resetSessionTime]);

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
    });
    // No onFinish past the last exercise. The only thing that gets here is a
    // playalong video running out (the Next button turns into Finish on the
    // last item), and handing that to the page's onFinish navigated away
    // without saving the session — the time was left for the report page to
    // "recover" and the run never counted toward quests. The session stays
    // put with the timer stopped; Finish saves it like any other run.
  }, [currentExerciseIndex, timer, saveTime, getTime, baseHandleNextExercise, plan.exercises.length]);

  const jumpToExercise = (index: number) => {
    saveTime(currentExerciseIndex, timer.getTime());
    const savedTime = getTime(index);
    timer.setInitialStartTime(savedTime || 0);
    setCurrentExerciseIndex(index);
  };

  const planTitleString = typeof plan.title === 'string' ? plan.title : plan.title;


  return useMemo(() => ({
    currentExerciseIndex,
    exerciseKey,
    showCompleteDialog,
    isMobileView,
    isFullSessionModalOpen,
    isMounted,
    currentExercise,
    isLastExercise,
    setShowCompleteDialog,
    handleNextExercise,
    startTimer: timer.startTimer,
    stopTimer: timer.stopTimer,
    resetTimer: timer.restartTime,
    setTimerTime: timer.setInitialStartTime,
    showSuccessView,
    restartFullSession,
    resetSuccessView: () => setShowSuccessView(false),
    setVideoDuration,
    videoDuration,
    setTabDuration,
    autoSubmitReport: (
      exerciseRecords?: any,
      micPerformance?: any,
      earTrainingPerformance?: any,
      options?: { skipSkillPoints?: boolean }
    ) => {
      // Both read in the same breath: the song shares are a slice of the
      // category totals and must come from the same snapshot.
      const { time, songTime, skillTime } = useSessionTimeStore.getState();
      return handleFinishSession(
        time,
        timer.stopTimer,
        exerciseRecords,
        micPerformance,
        earTrainingPerformance,
        songTime,
        skillTime,
        options
      );
    },
    canFinishSession,
    hasLoggedPractice,
    isSkillExercise,
    isSubmittingReport,
    completedExercises,
    reportResult,
    currentUserStats,
    previousUserStats,
    planTitleString,
    activityDataToUse,
    jumpToExercise,
    timer,
  }), [
    currentExerciseIndex, exerciseKey, showCompleteDialog, isMobileView,
    isFullSessionModalOpen, isMounted, currentExercise, isLastExercise,
    setShowCompleteDialog, handleNextExercise, timer, showSuccessView,
    restartFullSession, setVideoDuration, videoDuration, setTabDuration, handleFinishSession,
    canFinishSession, hasLoggedPractice, isSkillExercise, isSubmittingReport,
    completedExercises, reportResult, currentUserStats, previousUserStats,
    planTitleString, activityDataToUse
  ]);
};