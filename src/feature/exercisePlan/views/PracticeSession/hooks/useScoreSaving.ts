import { getExerciseUserRank } from "feature/leadboard/services/getExerciseUserRank";
import { selectUserAuth, selectUserAvatar, selectUserName } from "feature/user/store/userSlice";
import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "store/hooks";

import { saveLeaderboardEntry, updateClickHighScore, updateEarTrainingHighScore, updateMicHighScore } from "../../../services/bpmProgressService";
import type { Exercise, ScoredRun } from "../../../types/exercise.types";
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
  earTrainingScore, noteMatchingHandle, sessionBpm,
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

  const recordScoredRun = (run: ScoredRun) => {
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
    // and identical — result for every player.
    const runBpm     = activeExercise.metronomeSpeed ? Math.round(sessionBpmRef.current) : undefined;
    // A branch that doesn't fire this time must not report the previous
    // exercise's standing as if it belonged to this one.
    micStandingRef.current = {};
    earTrainingStandingRef.current = {};

    /**
     * Puts a score on the board and reads back the place it lands in. The write
     * isn't awaited: the count only looks at players *above* the standing score,
     * and the player's own entry is never one of them.
     */
    const placeOnLeaderboard = async (uid: string, score: number, previousBest: number): Promise<RunStanding> => {
      saveLeaderboardEntry(uid, exId, score, userName || "Anonymous", userAvatar || "", runBpm);
      const rank = await getExerciseUserRank(exId, Math.max(score, previousBest));
      return { ...(runBpm ? { bpm: runBpm } : {}), ...(rank ? { rank } : {}) };
    };

    if (userAuth && isMicEnabled && snap && snap.score > 0) {
      const result = await updateMicHighScore(userAuth, exId, snap.score, snap.accuracy, exTitle, exCategory);
      recordScoredRun({ exerciseId: exId, exerciseTitle: exTitle, score: snap.score, scoreType: "mic", previousBest: result.previousScore, bpm: runBpm });
      micStandingRef.current = await placeOnLeaderboard(userAuth, snap.score, result.previousScore);
      if (result.isNewRecord) {
        exerciseRecordsRef.current = {
          ...exerciseRecordsRef.current,
          micHighScore: { exerciseTitle: exTitle, score: snap.score, accuracy: snap.accuracy },
        };
      }
    }

    if (userAuth && currentExercise.riddleConfig?.mode === "sequenceRepeat" && earTrainingScore > 0) {
      const result = await updateEarTrainingHighScore(userAuth, exId, earTrainingScore, exTitle, exCategory);
      recordScoredRun({ exerciseId: exId, exerciseTitle: exTitle, score: earTrainingScore, scoreType: "earTraining", previousBest: result.previousScore, bpm: runBpm });
      earTrainingStandingRef.current = await placeOnLeaderboard(userAuth, earTrainingScore, result.previousScore);
      if (result.isNewRecord) {
        exerciseRecordsRef.current = {
          ...exerciseRecordsRef.current,
          earTrainingHighScore: { exerciseTitle: exTitle, score: earTrainingScore },
        };
      }
    }

    if (userAuth && isClickAnsweredMode(currentExercise.noteHuntConfig?.mode) && snap && snap.score > 0) {
      const result = await updateClickHighScore(userAuth, exId, snap.score, snap.accuracy, exTitle, exCategory);
      recordScoredRun({ exerciseId: exId, exerciseTitle: exTitle, score: snap.score, scoreType: "click", previousBest: result.previousScore, bpm: runBpm });
      micStandingRef.current = await placeOnLeaderboard(userAuth, snap.score, result.previousScore);
      if (result.isNewRecord) {
        exerciseRecordsRef.current = {
          ...exerciseRecordsRef.current,
          clickHighScore: { exerciseTitle: exTitle, score: snap.score, accuracy: snap.accuracy },
        };
      }
    }
  };

  return { saveCurrentScores, exerciseRecordsRef, scoredRuns, micStandingRef, earTrainingStandingRef };
}
