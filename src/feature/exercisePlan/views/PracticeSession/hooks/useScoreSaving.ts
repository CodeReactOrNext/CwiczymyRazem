import { submitDailyExerciseScore } from "feature/dailyExercise/services/dailyExercise.service";
import { findDailyDayKeyFor } from "feature/dailyExercise/utils/dailyExercise";
import { duelScoreKind } from "feature/duels/data/duelPool";
import { submitDuelRun } from "feature/duels/services/duels.service";
import { recordPracticeRun } from "feature/exerciseGoals/services/exerciseGoals.service";
import { getExerciseUserRank } from "feature/leadboard/services/getExerciseUserRank";
import { selectUserAuth, selectUserAvatar, selectUserName } from "feature/user/store/userSlice";
import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "store/hooks";

import { markExerciseCompleted, saveLeaderboardEntry, updateClickHighScore, updateEarTrainingHighScore, updateMicHighScore } from "../../../services/bpmProgressService";
import type { Exercise, ScoredRun } from "../../../types/exercise.types";
import { isRunWithinExerciseTime } from "../../../utils/exerciseTimeLimit";
import { hasLeaderboard } from "../../../utils/hasLeaderboard";
import { isClickAnsweredMode } from "../../../utils/huntModes";
import type { NoteMatchingHandle } from "../contexts/NoteMatchingContext";

interface UseScoreSavingOptions {
  activeExercise:       Exercise;
  currentExercise:      Exercise;
  isMicEnabled:         boolean;
  earTrainingScore:     number;
  noteMatchingHandle:   RefObject<NoteMatchingHandle | null>;
  /** Tempo the run is actually being played at — metronome BPM × speed multiplier. */
  sessionBpm:           number;
  /**
   * Put each scored run on its exercise's goal chart (when the exercise has an
   * open goal). Off in goal mode, which saves its runs itself — as goal runs.
   */
  recordGoalChartRuns?: boolean;
  /** Length of the play-along video the exercise runs to, when it has one. */
  videoDurationSeconds?: number | null;
  /**
   * The duel this session plays, if any. Its scored runs are sent to the duel
   * and kept off every public board, which would otherwise show the opponent
   * who is playing what.
   */
  duelId?: string | null;
}

/**
 * Where a saved run left the player, beyond the score itself — what the activity
 * feed reports alongside it.
 */
export interface RunStanding {
  /** Tempo this run was played at; absent on exercises without a metronome. */
  bpm?: number;
  /**
   * 1-based place the player holds on the exercise leaderboard. It ranks their
   * standing score, not this run: a run under their own record leaves that
   * record — and therefore the place — untouched. Absent when unreadable.
   */
  rank?: number;
}

export interface ScoreRecords {
  micHighScore?:         { exerciseTitle: string; score: number; accuracy: number };
  earTrainingHighScore?: { exerciseTitle: string; score: number };
  clickHighScore?:       { exerciseTitle: string; score: number; accuracy: number };
}

export function useScoreSaving({
  activeExercise, currentExercise, isMicEnabled,
  earTrainingScore, noteMatchingHandle, sessionBpm, recordGoalChartRuns = true,
  videoDurationSeconds = null, duelId = null,
}: UseScoreSavingOptions) {
  const userAuth   = useAppSelector(selectUserAuth);
  const userName   = useAppSelector(selectUserName);
  const userAvatar = useAppSelector(selectUserAvatar);
  const exerciseRecordsRef = useRef<ScoreRecords>({});
  // Read through a ref: `saveCurrentScores` is reached from callbacks that
  // deliberately freeze their deps (the exam auto-finish, the dev shortcut), and
  // a frozen closure must still stamp the tempo the session is on right now.
  const sessionBpmRef = useRef(sessionBpm);
  useEffect(() => { sessionBpmRef.current = sessionBpm; }, [sessionBpm]);
  // Filled by the last `saveCurrentScores()`, which every finish path awaits
  // before submitting — so the report can carry the standing into the feed.
  const micStandingRef = useRef<RunStanding>({});
  const earTrainingStandingRef = useRef<RunStanding>({});
  // Every scored run of the session, so the summary can place each exercise on
  // its own leaderboard — not just the last one played. State, not a ref: the
  // summary reads this while rendering.
  const [scoredRuns, setScoredRuns] = useState<ScoredRun[]>([]);

  const recordScoredRun = (run: ScoredRun, isRanked: boolean) => {
    // The summary card places each run on its board — skip runs that stay off it.
    if (!isRanked) return;
    setScoredRuns((tracked) => {
      // Keyed by exercise, not by score type: one exercise has one leaderboard,
      // and a click hunt with the mic on saves under both types, same score.
      const known = tracked.find((entry) => entry.exerciseId === run.exerciseId);
      if (!known) return [...tracked, run];
      // Replaying an exercise keeps the better run, but the record it started
      // from: by the second save the "previous best" already includes the first.
      // The tempo travels with the score it was set at, never with the other one.
      return tracked.map((entry) =>
        entry === known && run.score > entry.score
          ? { ...entry, score: run.score, bpm: run.bpm }
          : entry
      );
    });
  };

  const saveCurrentScores = async () => {
    const snap       = noteMatchingHandle.current?.snapshot();
    const exId       = activeExercise.id;
    const exTitle    = activeExercise.title;
    const exCategory = activeExercise.category;
    // Only exercises that carry a tempo get one on the board. Everything else
    // sits at the metronome's fallback 60 BPM, which would read as a real —
    // and identical — result for every player. A run whose tempo moved is
    // stamped with the slowest tempo it scored at, not the one it ended on.
    const runBpm     = activeExercise.metronomeSpeed
      ? Math.round(snap?.minScoredBpm ?? sessionBpmRef.current)
      : undefined;
    // A branch that doesn't fire this time must not report the previous
    // exercise's standing as if it belonged to this one.
    micStandingRef.current = {};
    earTrainingStandingRef.current = {};
    // A run that kept scoring past the exercise's own time is no attempt at the
    // exercise, so it stays off every board. It still counts as the player's own
    // practice: their record, goal chart and completion take it like any other.
    const isWithinTime = isRunWithinExerciseTime(activeExercise, snap?.runMs ?? 0, videoDurationSeconds);
    const isRanked = !duelId && hasLeaderboard(activeExercise) && isWithinTime;
    // A duel judges the same way the boards do: a run past the exercise time is
    // no attempt at it. Awaited, so the duel page shows the run on the way back;
    // a failure is logged and never holds up the finish.
    const sendDuelRun = async (score: number, accuracy: number) => {
      if (!duelId || !isWithinTime) return;
      await submitDuelRun({ duelId, score, accuracy, ...(runBpm ? { bpm: runBpm } : {}) })
        .catch((error) => console.error("Duel run was not saved", error));
    };

    /**
     * Puts a score on the board and reads back the place it lands in. The write
     * isn't awaited: the count only looks at players *above* the standing score,
     * and the player's own entry is never one of them.
     */
    const placeOnLeaderboard = async (uid: string, score: number, previousBest: number): Promise<RunStanding> => {
      // An overtime run still reports the tempo it was played at, just no place.
      if (!isRanked) return hasLeaderboard(activeExercise) && runBpm ? { bpm: runBpm } : {};
      saveLeaderboardEntry(uid, exId, score, userName || "Anonymous", userAvatar || "", runBpm);
      const rank = await getExerciseUserRank(exId, Math.max(score, previousBest));
      return { ...(runBpm ? { bpm: runBpm } : {}), ...(rank ? { rank } : {}) };
    };

    if (userAuth && isMicEnabled && snap && snap.score > 0) {
      const result = await updateMicHighScore(userAuth, exId, snap.score, snap.accuracy, exTitle, exCategory);
      recordScoredRun({ exerciseId: exId, exerciseTitle: exTitle, score: snap.score, scoreType: "mic", previousBest: result.previousScore, bpm: runBpm }, isRanked);
      micStandingRef.current = await placeOnLeaderboard(userAuth, snap.score, result.previousScore);
      if (duelScoreKind(activeExercise) === "mic") await sendDuelRun(snap.score, snap.accuracy);
      // The exercise of the day keeps its own board on top of the all-time one.
      // Not awaited — a failed daily write must never hold up the report.
      const dailyDayKey = findDailyDayKeyFor(exId);
      if (dailyDayKey && isRanked) {
        submitDailyExerciseScore({ dayKey: dailyDayKey, exerciseId: exId, score: snap.score, accuracy: snap.accuracy, bpm: runBpm })
          .catch((error) => console.error("Daily exercise score was not saved", error));
      }
      // Practice runs draw the climb on the goal chart. Not awaited, and the
      // service swallows its own errors — the chart is never worth a stalled finish.
      if (recordGoalChartRuns && runBpm) {
        void recordPracticeRun(userAuth, exId, { bpm: runBpm, accuracy: snap.accuracy }, snap.timingPrecision ?? null);
      }
      if (result.isNewRecord) {
        exerciseRecordsRef.current = {
          ...exerciseRecordsRef.current,
          micHighScore: { exerciseTitle: exTitle, score: snap.score, accuracy: snap.accuracy },
        };
      }
    }

    if (userAuth && currentExercise.riddleConfig?.mode === "sequenceRepeat" && earTrainingScore > 0) {
      const result = await updateEarTrainingHighScore(userAuth, exId, earTrainingScore, exTitle, exCategory);
      recordScoredRun({ exerciseId: exId, exerciseTitle: exTitle, score: earTrainingScore, scoreType: "earTraining", previousBest: result.previousScore, bpm: runBpm }, isRanked);
      earTrainingStandingRef.current = await placeOnLeaderboard(userAuth, earTrainingScore, result.previousScore);
      // Play by Ear has no accuracy of its own — 0 tells the duel page not to show one.
      if (duelScoreKind(activeExercise) === "earTraining") await sendDuelRun(earTrainingScore, 0);
      if (result.isNewRecord) {
        exerciseRecordsRef.current = {
          ...exerciseRecordsRef.current,
          earTrainingHighScore: { exerciseTitle: exTitle, score: earTrainingScore },
        };
      }
    }

    if (userAuth && isClickAnsweredMode(currentExercise.noteHuntConfig?.mode) && snap && snap.score > 0) {
      const result = await updateClickHighScore(userAuth, exId, snap.score, snap.accuracy, exTitle, exCategory);
      recordScoredRun({ exerciseId: exId, exerciseTitle: exTitle, score: snap.score, scoreType: "click", previousBest: result.previousScore, bpm: runBpm }, isRanked);
      micStandingRef.current = await placeOnLeaderboard(userAuth, snap.score, result.previousScore);
      if (result.isNewRecord) {
        exerciseRecordsRef.current = {
          ...exerciseRecordsRef.current,
          clickHighScore: { exerciseTitle: exTitle, score: snap.score, accuracy: snap.accuracy },
        };
      }
    }

    // Last, so it merges on top of whatever the branches above wrote: the exercise
    // was played through, and that alone is what marks it done in the skill tree.
    // Every branch above is conditional on a score, and a good part of the
    // catalogue — improv prompts, play-alongs, ear quizzes, the mic-less drills —
    // has no score to earn, so without this nothing would ever be recorded for them.
    if (userAuth) await markExerciseCompleted(userAuth, exId, exTitle, exCategory);
  };

  return { saveCurrentScores, exerciseRecordsRef, scoredRuns, micStandingRef, earTrainingStandingRef };
}
