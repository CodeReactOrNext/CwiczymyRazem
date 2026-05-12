import { useActivityLog } from 'components/ActivityLog/hooks/useActivityLog';
import { selectUserAuth } from 'feature/user/store/userSlice';
import { updateUserStats } from 'feature/user/store/userSlice.asyncThunk';
import { updateQuestProgress } from 'feature/user/store/userSlice.questActions';
import type { ReportDataInterface, ReportFormikInterface } from 'feature/user/view/ReportView/ReportView.types';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'store/hooks';

import type { ExercisePlan } from '../../../types/exercise.types';

interface UseSessionReportingProps {
  plan: ExercisePlan;
  avatar: string | null;
  completedExercises: number[];
}

export const useSessionReporting = ({ plan, avatar, completedExercises }: UseSessionReportingProps) => {
  const dispatch = useAppDispatch();
  const userAuth = useAppSelector(selectUserAuth);
  const { reportList } = useActivityLog(userAuth as string);

  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const isSubmittingRef = useRef(false);
  const [reportResult, setReportResult] = useState<ReportDataInterface | null>(null);
  const [sessionTimeSnapshot, setSessionTimeSnapshot] = useState<{
    technique: number;
    theory: number;
    hearing: number;
    creativity: number;
  } | null>(null);

  const handleFinishSession = useCallback(
    async (
      timerData: { technique: number; theory: number; hearing: number; creativity: number },
      stopTimer: () => void,
      exerciseRecords?: {
        micHighScore?: { exerciseTitle: string; score: number; accuracy: number };
        earTrainingHighScore?: { exerciseTitle: string; score: number };
      } | null,
      micPerformance?: { score: number; accuracy: number } | null,
      earTrainingPerformance?: { score: number } | null
    ) => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      stopTimer();

      const planTitle = typeof plan.title === 'string' ? plan.title : plan.title;

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
          habbits: ['exercise_plan'],
          avatarUrl: avatar || null,
          planId: plan.id,
          skillPointsGained: plan.exercises.reduce((acc, exercise, index) => {
            if (!completedExercises.includes(index)) {
              return acc;
            }

            let points = 0;
            if (exercise.difficulty === 'easy') points = 1;
            else if (exercise.difficulty === 'medium') points = 2;
            else if (exercise.difficulty === 'hard') points = 3;

            if (points > 0 && exercise.relatedSkills) {
              exercise.relatedSkills.forEach((skillId) => {
                acc[skillId] = (acc[skillId] || 0) + points;
              });
            }
            return acc;
          }, {} as Record<string, number>),
          ...(exerciseRecords && { exerciseRecords }),
          ...(micPerformance && { micPerformance }),
          ...(earTrainingPerformance && { earTrainingPerformance }),
          clientTodayISO: (() => {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          })(),
        };

        const result = await dispatch(updateUserStats({ inputData: reportData })).unwrap();
        setSessionTimeSnapshot(timerData);
        setReportResult(result.raitingData);

        dispatch(updateQuestProgress({ type: 'practice_plan' }));

        if (plan.id.startsWith('auto')) {
          dispatch(updateQuestProgress({ type: 'auto_plan' }));
        }

        dispatch(updateQuestProgress({ type: 'practice_specific_exercise', exerciseId: plan.id }));

        const hasSongs = plan.exercises.some((ex) => ex.isPlayalong || (ex.tablature && ex.tablature.length > 0));
        if (hasSongs) {
          dispatch(updateQuestProgress({ type: 'practice_any_song' }));
        }

        const totalMin = techMin + theoryMin + hearMin + creatMin;
        if (totalMin > 0) {
          dispatch(updateQuestProgress({ type: 'practice_total_time', amount: totalMin }));
        }
        if (techMin > 0) {
          dispatch(updateQuestProgress({ type: 'practice_technique_time', amount: techMin }));
        }
      } catch (error) {
        console.error('Auto report failed:', error);
        isSubmittingRef.current = false;
      } finally {
        setIsSubmittingReport(false);
      }
    },
    [plan, avatar, completedExercises, dispatch]
  );

  const activityDataToUse = useMemo(() => {
    const existingList: any[] = (reportList as any[]) ?? [];

    if (!reportResult || !sessionTimeSnapshot) return existingList;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const newEntry = {
      date: today.toISOString(),
      techniqueTime: sessionTimeSnapshot.technique,
      theoryTime: sessionTimeSnapshot.theory,
      hearingTime: sessionTimeSnapshot.hearing,
      creativityTime: sessionTimeSnapshot.creativity,
    };

    const exists = existingList.some((item) => new Date(item.date).toISOString().split('T')[0] === todayStr);

    if (exists) {
      return existingList.map((item) => {
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

    return [...existingList, newEntry];
  }, [reportList, reportResult, sessionTimeSnapshot]);

  const resetReporting = useCallback(() => {
    setReportResult(null);
    setIsSubmittingReport(false);
    isSubmittingRef.current = false;
    setSessionTimeSnapshot(null);
  }, []);

  return {
    isSubmittingReport,
    reportResult,
    handleFinishSession,
    activityDataToUse,
    resetReporting,
  };
};
