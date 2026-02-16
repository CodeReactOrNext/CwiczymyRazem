import { useActivityLog } from 'components/ActivityLog/hooks/useActivityLog';
import { selectCurrentUserStats, selectPreviousUserStats, selectTimerData, selectUserAuth, selectUserAvatar } from 'feature/user/store/userSlice';
import { updateQuestProgress, updateUserStats } from 'feature/user/store/userSlice.asyncThunk';
import { setActivity } from 'feature/user/store/userSlice';
import type { ReportDataInterface, ReportFormikInterface } from 'feature/user/view/ReportView/ReportView.types';
import useTimer from 'hooks/useTimer';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'store/hooks';

import type { ExercisePlan } from '../../../types/exercise.types';
import { useExerciseNavigation } from './useExerciseNavigation';
import { useTimeTracking } from './useTimeTracking';
import { useUIState } from './useUIState';

interface UsePracticeSessionStateProps {
  plan: ExercisePlan;
  onFinish?: () => void;
  autoReport?: boolean;
  forceFullDuration?: boolean;
  skillRewardSkillId?: string;
  skillRewardAmount?: number;
}

export const usePracticeSessionState = ({ plan, onFinish, forceFullDuration, skillRewardSkillId, skillRewardAmount }: UsePracticeSessionStateProps) => {
  const dispatch = useAppDispatch();
  const timerData = useAppSelector(selectTimerData);
  const avatar = useAppSelector(selectUserAvatar);
  const currentUserStats = useAppSelector(selectCurrentUserStats);
  const previousUserStats = useAppSelector(selectPreviousUserStats);

  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const isSubmittingRef = useRef(false);
  const [reportResult, setReportResult] = useState<ReportDataInterface | null>(null);
  const [exerciseTimes, setExerciseTimes] = useState<Record<number, number>>({});
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);

  const userAuth = useAppSelector(selectUserAuth);
  const { reportList } = useActivityLog(userAuth as string);

  // Challenges removed

  const {
    currentExerciseIndex,
    setCurrentExerciseIndex,
    exerciseKey,
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

  const toggleTimer = (metronomeToggle?: () => void) => {
    if (timer.timerEnabled) {
      timer.stopTimer();
      if (metronomeToggle) metronomeToggle();
    } else {
      timer.startTimer();
      if (metronomeToggle) metronomeToggle();
    }
  }

  const effectiveTotalSeconds = (currentExercise.isPlayalong && videoDuration)
    ? videoDuration
    : currentExercise.timeInMinutes * 60;

  const timeLeft = Math.max(0, Math.floor((effectiveTotalSeconds * 1000 - timer.time) / 1000));
  const formattedTimeLeft = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`;
  const timerProgressValue = Math.min(100, (timer.time / (effectiveTotalSeconds * 1000)) * 100);

  const canSkipExercise = !forceFullDuration || timeLeft <= 0;

  const checkForSuccess = useCallback(() => {
    if (isLastExercise && timeLeft <= 0) {
      setShowSuccessView(true);
    }
  }, [isLastExercise, timeLeft]);

  useEffect(() => {
    checkForSuccess();
  }, [checkForSuccess]);

  // Track completion
  useEffect(() => {
    if (timeLeft <= 0 && !completedExercises.includes(currentExerciseIndex)) {
      setCompletedExercises(prev => [...prev, currentExerciseIndex]);
    }
  }, [timeLeft, currentExerciseIndex, completedExercises]);

  // Update online activity
  useEffect(() => {
    if (userAuth) {
      dispatch(setActivity({
        planTitle: typeof plan.title === 'string' ? plan.title : plan.title,
        exerciseTitle: currentExercise.title,
        category: currentExercise.category,
        timestamp: Date.now()
      }));
    }

    return () => {
      // Clear activity when leaving the page/session
      dispatch(setActivity(null));
    };
  }, [userAuth, currentExercise, plan, dispatch]);

  const resetSuccessView = useCallback(() => {
    setShowSuccessView(false);
  }, []);

  const handleFinishSession = useCallback(async (exerciseRecords?: {
    micHighScore?: { exerciseTitle: string; score: number; accuracy: number };
    earTrainingHighScore?: { exerciseTitle: string; score: number };
  } | null) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
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
        planId: plan.id,
        skillPointsGained: plan.exercises.reduce((acc, exercise, index) => {
          // Only award points if exercise was completed
          if (!completedExercises.includes(index)) {
            return acc;
          }

          let points = 0;
          if (exercise.difficulty === 'easy') points = 1;
          else if (exercise.difficulty === 'medium') points = 2;
          else if (exercise.difficulty === 'hard') points = 3;

          if (points > 0 && exercise.relatedSkills) {
            exercise.relatedSkills.forEach(skillId => {
              acc[skillId] = (acc[skillId] || 0) + points;
            });
          }
          return acc;
        }, {} as Record<string, number>),
        ...(exerciseRecords && { exerciseRecords }),
      };

      const result = await dispatch(updateUserStats({ inputData: reportData })).unwrap();
      setReportResult(result.raitingData);

      // Challenges removed
      dispatch(updateQuestProgress({ type: 'practice_plan' }));
      dispatch(updateQuestProgress({ type: 'practice_any_song' }));

    } catch (error) {
      console.error("Auto report failed:", error);
      isSubmittingRef.current = false;
    } finally {
      setIsSubmittingReport(false);
    }
  }, [timer, plan, timerData, avatar, dispatch]);

  const autoSubmitReport = handleFinishSession;

  const activityDataToUse = useMemo(() => {
    if (!reportList || (reportList as any[]).length === 0) return [];
    if (!reportResult) return reportList as any;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const newEntry = {
      date: today.toISOString(),
      techniqueTime: timerData.technique,
      theoryTime: timerData.theory,
      hearingTime: timerData.hearing,
      creativityTime: timerData.creativity,
    };

    const exists = (reportList as any[]).some(item =>
      new Date(item.date).toISOString().split('T')[0] === todayStr
    );

    if (exists) {
      return (reportList as any[]).map(item => {
        if (new Date(item.date).toISOString().split('T')[0] === todayStr) {
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
    }

    return [...(reportList as any), newEntry];
  }, [reportList, reportResult, timerData]);

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
    handleNextExercise: (resetTimerFn: () => void) => {
      // Save current time before moving next
      setExerciseTimes(prev => ({
        ...prev,
        [currentExerciseIndex]: timer.time
      }));

      // In useExerciseNavigation, handleNextExercise calls resetTimerFn()
      // We will override this by loading the next saved time right after if possible, 
      // but the base hook is simple. We'll handle the load in an effect or here.
      baseHandleNextExercise(() => {
        const nextIndex = currentExerciseIndex + 1;
        if (nextIndex < plan.exercises.length) {
          const savedTime = exerciseTimes[nextIndex] || 0;
          timer.setInitialStartTime(savedTime);
        } else {
          resetTimerFn();
        }
      }, onFinish);
    },
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
      // Save current exercise time
      setExerciseTimes(prev => ({
        ...prev,
        [currentExerciseIndex]: timer.time
      }));

      // Load target exercise time
      const savedTime = exerciseTimes[index] || 0;
      timer.setInitialStartTime(savedTime);
      setCurrentExerciseIndex(index);
    }
  };
};