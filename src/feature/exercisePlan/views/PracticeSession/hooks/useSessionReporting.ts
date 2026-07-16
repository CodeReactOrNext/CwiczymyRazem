import { useActivityLog } from 'components/ActivityLog/hooks/useActivityLog';
import { selectUserAuth } from 'feature/user/store/userSlice';
import { updateUserStats } from 'feature/user/store/userSlice.asyncThunk';
import { updateQuestProgress } from 'feature/user/store/userSlice.questActions';
import type { ReportDataInterface, ReportFormikInterface } from 'feature/user/view/ReportView/ReportView.types';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'store/hooks';
import { getStreakFromActivityLog } from 'utils/gameLogic';

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
        // Round to the nearest minute — the tracked time runs a hair short of the
        // exercise timer (sub-second ticks), so flooring turned 5:00 into 4 min.
        const techMin = Math.round(timerData.technique / 60000);
        const theoryMin = Math.round(timerData.theory / 60000);
        const hearMin = Math.round(timerData.hearing / 60000);
        const creatMin = Math.round(timerData.creativity / 60000);

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
          reportTitle: plan.song ? `Song: ${plan.song.artist} - ${plan.song.title}` : planTitle,
          habbits: ['exercise_plan'],
          avatarUrl: avatar || null,
          planId: plan.id,
          ...(plan.song && {
            songId: plan.song.id,
            songTitle: plan.song.title,
            songArtist: plan.song.artist,
          }),
          skillPointsGained: plan.exercises.reduce((acc, exercise, index) => {
            if (!completedExercises.includes(index)) {
              return acc;
            }

            let points = 0;
            if (exercise.difficulty === 'beginner') points = 1;
            else if (exercise.difficulty === 'easy') points = 1;
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
          clientNowISO: new Date().toISOString(),
          clientDisplayStreak: getStreakFromActivityLog(
            ((reportList as any[]) ?? []).map((report) => report.date),
            { includeToday: true }
          ),
        };

        const result = await dispatch(updateUserStats({ inputData: reportData })).unwrap();
        setSessionTimeSnapshot(timerData);
        setReportResult(result.raitingData);

        dispatch(updateQuestProgress({ type: 'practice_plan' }));
        dispatch(updateQuestProgress({ type: 'complete_two_plans' }));

        if (plan.id.startsWith('auto')) {
          dispatch(updateQuestProgress({ type: 'auto_plan' }));
        }

        dispatch(updateQuestProgress({ type: 'practice_specific_exercise', exerciseId: plan.id }));

        // "Practice any Song" is completed via the song timer (/timer/song) and via
        // GP-file/tab song practice (this plan carries `song` metadata in that case).
        // Regular practice-plan sessions — auto plans and playalong exercises —
        // must not complete it.
        if (plan.song) {
          dispatch(updateQuestProgress({ type: 'practice_any_song' }));

          const totalMs = timerData.technique + timerData.theory + timerData.hearing + timerData.creativity;
          if (totalMs > 0) {
            const { recordPracticeSession } = await import('feature/songs/services/userSongProgress.service');
            await recordPracticeSession(userAuth as string, plan.song.id, totalMs, null, null);
          }
        }

        const totalMin = techMin + theoryMin + hearMin + creatMin;
        if (totalMin > 0) {
          dispatch(updateQuestProgress({ type: 'practice_total_time', amount: totalMin }));
          dispatch(updateQuestProgress({ type: 'long_session', amount: totalMin }));
        }
        if (techMin > 0) {
          dispatch(updateQuestProgress({ type: 'practice_technique_time', amount: techMin }));
        }
        if (theoryMin > 0) {
          dispatch(updateQuestProgress({ type: 'practice_theory_time', amount: theoryMin }));
        }
        if (hearMin > 0) {
          dispatch(updateQuestProgress({ type: 'practice_hearing_time', amount: hearMin }));
        }
        if (creatMin > 0) {
          dispatch(updateQuestProgress({ type: 'practice_creativity_time', amount: creatMin }));
          dispatch(updateQuestProgress({ type: 'creativity_focus', amount: creatMin }));
        }

        const activeCategories = [techMin, theoryMin, hearMin, creatMin].filter((m) => m > 0).length;
        if (activeCategories > 0) {
          dispatch(updateQuestProgress({ type: 'well_rounded', amount: activeCategories }));
        }
        const categoriesOverFive = [techMin, theoryMin, hearMin, creatMin].filter((m) => m >= 5).length;
        if (categoriesOverFive > 0) {
          dispatch(updateQuestProgress({ type: 'two_categories_min', amount: categoriesOverFive }));
        }
        if (techMin > 0 && theoryMin > 0) {
          dispatch(updateQuestProgress({ type: 'balanced_session', amount: 2 }));
        }

        const exercisesPracticed = completedExercises.length;
        if (exercisesPracticed > 0) {
          dispatch(updateQuestProgress({ type: 'practice_three_exercises', amount: exercisesPracticed }));
        }
        if (Object.keys(reportData.skillPointsGained || {}).length > 0) {
          dispatch(updateQuestProgress({ type: 'improve_skill' }));
        }
      } catch (error) {
        console.error('Auto report failed:', error);
        isSubmittingRef.current = false;
      } finally {
        setIsSubmittingReport(false);
      }
    },
    [plan, avatar, completedExercises, dispatch, reportList, userAuth]
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
