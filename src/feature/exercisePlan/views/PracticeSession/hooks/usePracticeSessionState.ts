import useTimer from 'hooks/useTimer';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { i18n } from 'next-i18next';

import type { ExercisePlan, LocalizedContent } from '../../../types/exercise.types';
import { useExerciseNavigation } from './useExerciseNavigation';
import { useTimeTracking } from './useTimeTracking';
import { useUIState } from './useUIState';
import { useAppDispatch, useAppSelector } from 'store/hooks';
import { selectCurrentUserStats, selectPreviousUserStats, selectTimerData, selectUserAvatar, selectUserAuth } from 'feature/user/store/userSlice';
import { updateUserStats, checkAndSaveChallengeProgress, updateQuestProgress } from 'feature/user/store/userSlice.asyncThunk';
import { convertMsToHMObject } from 'utils/converter';
import type { ReportFormikInterface, ReportDataInterface } from 'feature/user/view/ReportView/ReportView.types';
import { useRouter } from 'next/router';
import { useActivityLog } from 'components/ActivityLog/hooks/useActivityLog';

interface UsePracticeSessionStateProps {
  plan: ExercisePlan;
  onFinish?: () => void;
  autoReport?: boolean;
}

export const usePracticeSessionState = ({ plan, onFinish, autoReport }: UsePracticeSessionStateProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const timerData = useAppSelector(selectTimerData);
  const avatar = useAppSelector(selectUserAvatar);
  const currentUserStats = useAppSelector(selectCurrentUserStats);
  const previousUserStats = useAppSelector(selectPreviousUserStats);

  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportResult, setReportResult] = useState<ReportDataInterface | null>(null);

  const userAuth = useAppSelector(selectUserAuth);
  const { reportList } = useActivityLog(userAuth as string);

  const isChallenge = (currentUserStats?.activeChallenges || []).some(ac => ac.challengeId === plan.id);

  const {
    currentExerciseIndex,
    setCurrentExerciseIndex,
    exerciseKey,
    setExerciseKey,
    currentExercise,
    nextExercise,
    isLastExercise,
    handleNextExercise: baseHandleNextExercise
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

  const [showSuccessView, setShowSuccessView] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const { exerciseTimeSpent } = useTimeTracking(timer, currentExercise);

  const toggleTimer = () => {
    if (timer.timerEnabled) {
      timer.stopTimer();
    } else {
      timer.startTimer();
    }
  }

  const effectiveTotalSeconds = (currentExercise.isPlayalong && videoDuration)
    ? videoDuration
    : currentExercise.timeInMinutes * 60;

  const timeLeft = Math.max(0, Math.floor((effectiveTotalSeconds * 1000 - timer.time) / 1000));
  const formattedTimeLeft = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`;
  const timerProgressValue = Math.min(100, (timer.time / (effectiveTotalSeconds * 1000)) * 100);

  const canSkipExercise = !isChallenge || timeLeft <= 0;

  const checkForSuccess = useCallback(() => {
    if (isLastExercise && timeLeft <= 0) {
      setShowSuccessView(true);
    }
  }, [isLastExercise, timeLeft]);

  useEffect(() => {
    checkForSuccess();
  }, [checkForSuccess]);

  const resetSuccessView = useCallback(() => {
    setShowSuccessView(false);
  }, []);

  const handleFinishSession = useCallback(async () => {
    timer.stopTimer();

    const planTitle = typeof plan.title === 'string'
      ? plan.title
      : plan.title;

    setIsSubmittingReport(true);
    try {
      const techMin = Math.floor(timerData.technique / 60000);
      const theoryMin = Math.floor(timerData.theory / 60000);
      const hearMin = Math.floor(timerData.hearing / 60000);
      const creatMin = Math.floor(timerData.creativity / 60000);

      const reportData: ReportFormikInterface = {
        techniqueHours: Math.floor(techMin / 60).toString(),
        techniqueMinutes: (techMin % 60).toString(),
        theoryHours: Math.floor(theoryMin / 60).toString(),
        theoryMinutes: (theoryMin % 60).toString(),
        hearingHours: Math.floor(hearMin / 60).toString(),
        hearingMinutes: (hearMin % 60).toString(),
        creativityHours: Math.floor(creatMin / 60).toString(),
        creativityMinutes: (creatMin % 60).toString(),
        countBackDays: 0,
        reportTitle: planTitle,
        habbits: ["exercise_plan"],
        avatarUrl: avatar || null,
        planId: plan.id
      };

      const result = await dispatch(updateUserStats({ inputData: reportData })).unwrap();
      setReportResult(result.raitingData);

      // Update challenges and quests
      dispatch(checkAndSaveChallengeProgress(plan.id));
      dispatch(updateQuestProgress({ type: 'practice_plan' }));
      dispatch(updateQuestProgress({ type: 'practice_any_song' }));

    } catch (error) {
      console.error("Auto report failed:", error);
    } finally {
      setIsSubmittingReport(false);
    }
  }, [timer, plan, timerData, avatar, dispatch]);

  const autoSubmitReport = handleFinishSession;

  const activityDataToUse = reportList as any;

  const planTitleString = typeof plan.title === 'string'
    ? plan.title
    : plan.title;

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
    handleNextExercise: (resetTimerFn: () => void) => baseHandleNextExercise(resetTimerFn, onFinish),
    toggleTimer,
    startTimer: timer.startTimer,
    stopTimer: timer.stopTimer,
    resetTimer: timer.restartTime,
    setTimerTime: timer.setInitialStartTime,
    showSuccessView,
    setShowSuccessView,
    resetSuccessView,
    setVideoDuration,
    autoSubmitReport,
    canSkipExercise,
    isSubmittingReport,
    reportResult,
    currentUserStats,
    previousUserStats,
    planTitleString,
    sessionTimerData: timerData,
    exerciseTimeSpent,
    activityDataToUse,
    jumpToExercise: (index: number) => {
      timer.restartTime();
      setCurrentExerciseIndex(index);
    }
  };
};