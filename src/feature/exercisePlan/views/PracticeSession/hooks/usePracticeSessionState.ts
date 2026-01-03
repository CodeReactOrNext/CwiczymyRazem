import useTimer from 'hooks/useTimer';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { i18n } from 'next-i18next';

import type { ExercisePlan, LocalizedContent } from '../../../types/exercise.types';
import { useExerciseNavigation } from './useExerciseNavigation';
import { useTimeTracking } from './useTimeTracking';
import { useUIState } from './useUIState';
import { useAppDispatch, useAppSelector } from 'store/hooks';
import { selectCurrentUserStats, selectPreviousUserStats, selectTimerData, selectUserAvatar } from 'feature/user/store/userSlice';
import { updateUserStats, checkAndSaveChallengeProgress, updateQuestProgress } from 'feature/user/store/userSlice.asyncThunk';
import { convertMsToHMObject } from 'utils/converter';
import type { ReportFormikInterface, ReportDataInterface } from 'feature/user/view/ReportView/ReportView.types';


interface UsePracticeSessionStateProps {
  plan: ExercisePlan;
  onFinish?: () => void;
}

export const usePracticeSessionState = ({ plan, onFinish }: UsePracticeSessionStateProps) => {
  const dispatch = useAppDispatch();
  const timerData = useAppSelector(selectTimerData);
  const avatar = useAppSelector(selectUserAvatar);
  const currentUserStats = useAppSelector(selectCurrentUserStats);
  const previousUserStats = useAppSelector(selectPreviousUserStats);

  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportResult, setReportResult] = useState<ReportDataInterface | null>(null);

  const isChallenge = currentUserStats?.activeChallenge?.challengeId === plan.id;
  console.log('[Challenge] isChallenge:', isChallenge, 'plan.id:', plan.id, 'activeChallenge:', currentUserStats?.activeChallenge);

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
  console.log('[Challenge] canSkipExercise:', canSkipExercise, 'timeLeft:', timeLeft, 'isChallenge:', isChallenge);

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

  const autoSubmitReport = useCallback(async () => {
    setIsSubmittingReport(true);

    const techniqueTime = convertMsToHMObject(timerData.technique);
    const theoryTime = convertMsToHMObject(timerData.theory);
    const hearingTime = convertMsToHMObject(timerData.hearing);
    const creativityTime = convertMsToHMObject(timerData.creativity);

    const planTitle = typeof plan.title === 'string'
      ? plan.title
      : (plan.title as LocalizedContent)[(i18n?.language as 'pl' | 'en') || 'pl'];

    const inputData: ReportFormikInterface = {
      techniqueHours: techniqueTime.hours,
      techniqueMinutes: techniqueTime.minutes,
      theoryHours: theoryTime.hours,
      theoryMinutes: theoryTime.minutes,
      hearingHours: hearingTime.hours,
      hearingMinutes: hearingTime.minutes,
      creativityHours: creativityTime.hours,
      creativityMinutes: creativityTime.minutes,
      habbits: [],
      countBackDays: 0,
      reportTitle: planTitle,
      avatarUrl: avatar ?? null,
      planId: plan.id || null,
    };

    try {
      const result = await dispatch(updateUserStats({ inputData })).unwrap();
      setReportResult(result.raitingData);

      // Quest Triggers
      dispatch(updateQuestProgress({ type: 'practice_plan' }));

      if (plan.id && plan.id.startsWith('auto')) {
        dispatch(updateQuestProgress({ type: 'auto_plan' }));
      }

      const isSongPlan = plan.exercises.some(ex => ex.isPlayalong || ex.videoUrl?.includes('youtu') || (ex as any).category === 'song');
      if (isSongPlan) {
        dispatch(updateQuestProgress({ type: 'practice_any_song' }));
      }

      dispatch(checkAndSaveChallengeProgress());

    } catch (error) {
      console.error("Auto-submit report failed:", error);
    } finally {
      setIsSubmittingReport(false);
    }
  }, [timerData, plan, avatar, dispatch]);

  const planTitleString = typeof plan.title === 'string'
    ? plan.title
    : (plan.title as LocalizedContent)[(i18n?.language as 'pl' | 'en') || 'pl'];

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
    jumpToExercise: (index: number) => {
      timer.restartTime();
      setCurrentExerciseIndex(index);
    }
  };
};