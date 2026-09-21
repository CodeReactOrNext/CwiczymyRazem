import { useQueryClient } from '@tanstack/react-query';
import { useActivityLog } from 'components/ActivityLog/hooks/useActivityLog';
import { isAutoPlanId, isRecognizedPracticePlan } from 'feature/exercisePlan/utils/isRecognizedPracticePlan';
import { collectPlanSongPractice, pickPrimaryPlanSong } from 'feature/exercisePlan/utils/planSongPractice';
import { selectUserAuth } from 'feature/user/store/userSlice';
import { updateUserStats } from 'feature/user/store/userSlice.asyncThunk';
import { updateQuestProgress } from 'feature/user/store/userSlice.questActions';
import type { ReportDataInterface, ReportFormikInterface } from 'feature/user/view/ReportView/ReportView.types';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'store/hooks';
import { getLocalDateKey } from 'utils/converter';
import { getClientReportContext } from 'utils/gameLogic';

import type { ExercisePlan } from '../../../types/exercise.types';
import { computeSkillPointsGained } from '../utils/skillPoints';

interface UseSessionReportingProps {
  plan: ExercisePlan;
  avatar: string | null;
  completedExercises: number[];
}

export const useSessionReporting = ({ plan, avatar, completedExercises }: UseSessionReportingProps) => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
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
      micPerformance?: { score: number; accuracy: number; bpm?: number; rank?: number } | null,
      earTrainingPerformance?: { score: number; rank?: number } | null,
      /** Time the session measured on each song item of the plan, by song id
       *  (sessionTimeStore.songTime). A slice of `timerData`, not on top of it. */
      songTime: Record<string, number> = {},
      /** Set when the player ended the session early, before the bar the
       *  session set for itself. The practice time is still logged and scores
       *  still stand — the skill points are what an early finish gives up. */
      options?: { skipSkillPoints?: boolean }
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

        // Songs placed in the routine as their own items. A plan that *is* a
        // song (`plan.song`, the single-song wrapper) attributes the whole
        // session to that song below instead, so the two paths never both
        // credit the same minutes.
        const planSongs = plan.song ? [] : collectPlanSongPractice(plan, songTime);
        const primarySong = plan.song
          ? { id: plan.song.id, title: plan.song.title, artist: plan.song.artist }
          : (() => {
              const primary = pickPrimaryPlanSong(planSongs);
              return primary
                ? { id: primary.songId, title: primary.songTitle, artist: primary.songArtist }
                : null;
            })();

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
          ...(primarySong && {
            songId: primarySong.id,
            songTitle: primarySong.title,
            songArtist: primarySong.artist,
          }),
          ...(planSongs.length > 0 && { songs: planSongs }),
          skillPointsGained: options?.skipSkillPoints
            ? {}
            : computeSkillPointsGained(plan.exercises, completedExercises),
          ...(exerciseRecords && { exerciseRecords }),
          ...(micPerformance && { micPerformance }),
          ...(earTrainingPerformance && { earTrainingPerformance }),
          ...getClientReportContext(
            ((reportList as any[]) ?? []).map((report) => report.date)
          ),
        };

        const result = await dispatch(updateUserStats({ inputData: reportData })).unwrap();
        setSessionTimeSnapshot(timerData);
        setReportResult(result.raitingData);

        // "Complete a Practice Plan" must only fire for an actual Practice Plan
        // (default/custom/auto), not for ad-hoc single-exercise sessions started
        // from the Skill Dashboard, Exercise Library, scale drills, etc — see #731.
        if (isRecognizedPracticePlan(plan)) {
          dispatch(updateQuestProgress({ type: 'practice_plan' }));
          dispatch(updateQuestProgress({ type: 'complete_two_plans' }));
        }

        if (isAutoPlanId(plan.id)) {
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
            // Kept on its own error path: this await sits in the middle of the
            // quest dispatches, so a failed song-progress write used to abort
            // the rest of them (time, categories, exercises) into the outer
            // catch and silently cost the player those tasks.
            try {
              const { recordPracticeSession } = await import('feature/songs/services/userSongProgress.service');
              await recordPracticeSession(userAuth as string, plan.song.id, totalMs, null, null);
            } catch (error) {
              console.error('Failed to record song practice progress:', error);
            }
          }
        }

        // Songs practised as items of the routine: each one's measured share of
        // the session lands on its own progress (time, session count) and pulls
        // it into "learning" — the same bookkeeping the song timer and a manual
        // song log do, so a song counts the same however it was practised.
        if (planSongs.length > 0) {
          dispatch(updateQuestProgress({ type: 'practice_any_song', amount: planSongs.length }));
          try {
            const [{ recordPracticeSession }, { ensureSongIsLearning }] = await Promise.all([
              import('feature/songs/services/userSongProgress.service'),
              import('feature/songs/services/udateSongStatus'),
            ]);
            await Promise.all(
              planSongs.map(async (song) => {
                await recordPracticeSession(userAuth as string, song.songId, song.practiceMs, null, null);
                await ensureSongIsLearning(
                  userAuth as string,
                  song.songId,
                  song.songTitle,
                  song.songArtist,
                  avatar ?? undefined
                );
              })
            );
            queryClient.invalidateQueries({ queryKey: ['user-song-progress', userAuth] });
            queryClient.invalidateQueries({ queryKey: ['user-songs', userAuth] });
          } catch (error) {
            console.error('Failed to record song practice progress for plan songs:', error);
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
    [plan, avatar, completedExercises, dispatch, queryClient, reportList, userAuth]
  );

  const activityDataToUse = useMemo(() => {
    const existingList: any[] = (reportList as any[]) ?? [];

    if (!reportResult || !sessionTimeSnapshot) return existingList;

    const today = new Date();
    // Local, not UTC. This list is the activity log the streak and the heatmap
    // are derived from, and those follow the player's own calendar day — bucketing
    // by the UTC day would fold an evening session in the Americas into the next
    // day's row and make the just-finished session look like it never happened.
    const todayStr = getLocalDateKey(today);

    const newEntry = {
      date: today.toISOString(),
      techniqueTime: sessionTimeSnapshot.technique,
      theoryTime: sessionTimeSnapshot.theory,
      hearingTime: sessionTimeSnapshot.hearing,
      creativityTime: sessionTimeSnapshot.creativity,
    };

    const exists = existingList.some((item) => getLocalDateKey(new Date(item.date)) === todayStr);

    if (exists) {
      return existingList.map((item) => {
        if (getLocalDateKey(new Date(item.date)) === todayStr) {
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
