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
  const [submittedValues, setSubmittedValues] = useState<ReportFormikInterface | null>(null);

  const userAuth = useAppSelector(selectUserAuth);
  const { reportList } = useActivityLog(userAuth as string);

  const isChallenge = (currentUserStats?.activeChallenges || []).some(ac => ac.challengeId === plan.id);
  console.log('[Challenge] isChallenge:', isChallenge, 'plan.id:', plan.id, 'activeChallenges:', currentUserStats?.activeChallenges);

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

  const handleFinishSession = useCallback(async () => {
    timer.stopTimer();

    const planTitle = typeof plan.title === 'string'
      ? plan.title
      : (plan.title as LocalizedContent)[(i18n?.language as 'pl' | 'en') || 'pl'];

    if (autoReport) {
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
        setSubmittedValues(reportData);

        // Update challenges and quests
        dispatch(checkAndSaveChallengeProgress(plan.id));
        dispatch(updateQuestProgress({ type: 'practice_plan' }));
        dispatch(updateQuestProgress({ type: 'practice_any_song' }));

      } catch (error) {
        console.error("Auto report failed:", error);
        // Fallback or error handling
      } finally {
        setIsSubmittingReport(false);
      }
      return;
    }

    const params = new URLSearchParams();
    params.set('planId', plan.id || '');
    params.set('planTitle', planTitle);

    router.push(`/report?${params.toString()}`);
  }, [timer, plan, router, autoReport, timerData, avatar, dispatch]);

  const autoSubmitReport = handleFinishSession;

  const getUpdatedActivityData = useCallback(() => {
    if (!reportList) return [];
    if (!submittedValues) return reportList as any;

    const reportDate = new Date(); // Auto report is always today
    const dateString = reportDate.toISOString();

    const entryTechnique = (Number(submittedValues.techniqueHours || 0) * 60 + Number(submittedValues.techniqueMinutes || 0)) * 60 * 1000;
    const entryTheory = (Number(submittedValues.theoryHours || 0) * 60 + Number(submittedValues.theoryMinutes || 0)) * 60 * 1000;
    const entryHearing = (Number(submittedValues.hearingHours || 0) * 60 + Number(submittedValues.hearingMinutes || 0)) * 60 * 1000;
    const entryCreativity = (Number(submittedValues.creativityHours || 0) * 60 + Number(submittedValues.creativityMinutes || 0)) * 60 * 1000;

    const newEntry = {
      date: dateString,
      techniqueTime: entryTechnique,
      theoryTime: entryTheory,
      hearingTime: entryHearing,
      creativityTime: entryCreativity,
    };

    const exists = (reportList as any[]).some(item => {
      const itemDate = new Date(item.date);
      return itemDate.toDateString() === reportDate.toDateString();
    });

    if (exists) {
      return (reportList as any[]).map(item => {
        const itemDate = new Date(item.date);
        if (itemDate.toDateString() === reportDate.toDateString()) {
          return {
            ...item,
            techniqueTime: Number(item.techniqueTime || 0) + newEntry.techniqueTime,
            theoryTime: Number(item.theoryTime || 0) + newEntry.theoryTime,
            hearingTime: Number(item.hearingTime || 0) + newEntry.hearingTime,
            creativityTime: Number(item.creativityTime || 0) + newEntry.creativityTime,
          };
        }
        return item;
      });
    } else {
      return [...(reportList as any), newEntry];
    }
  }, [reportList, submittedValues]);

  const activityDataToUse = submittedValues ? getUpdatedActivityData() : (reportList as any);

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
    activityDataToUse,
    jumpToExercise: (index: number) => {
      timer.restartTime();
      setCurrentExerciseIndex(index);
    }
  };
};