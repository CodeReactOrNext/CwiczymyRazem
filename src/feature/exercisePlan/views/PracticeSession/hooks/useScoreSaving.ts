import { selectUserAuth, selectUserAvatar, selectUserName } from "feature/user/store/userSlice";
import type { RefObject } from "react";
import { useRef, useState } from "react";
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
}

export interface ScoreRecords {
  micHighScore?:         { exerciseTitle: string; score: number; accuracy: number };
  earTrainingHighScore?: { exerciseTitle: string; score: number };
  clickHighScore?:       { exerciseTitle: string; score: number; accuracy: number };
}

export function useScoreSaving({
  activeExercise, currentExercise, isMicEnabled,
  earTrainingScore, noteMatchingHandle,
}: UseScoreSavingOptions) {
  const userAuth   = useAppSelector(selectUserAuth);
  const userName   = useAppSelector(selectUserName);
  const userAvatar = useAppSelector(selectUserAvatar);
  const exerciseRecordsRef = useRef<ScoreRecords>({});
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
      return tracked.map((entry) =>
        entry === known ? { ...entry, score: Math.max(entry.score, run.score) } : entry
      );
    });
  };

  const saveCurrentScores = async () => {
    const snap       = noteMatchingHandle.current?.snapshot();
    const exId       = activeExercise.id;
    const exTitle    = activeExercise.title;
    const exCategory = activeExercise.category;

    if (userAuth && isMicEnabled && snap && snap.score > 0) {
      const result = await updateMicHighScore(userAuth, exId, snap.score, snap.accuracy, exTitle, exCategory);
      recordScoredRun({ exerciseId: exId, exerciseTitle: exTitle, score: snap.score, scoreType: "mic", previousBest: result.previousScore });
      saveLeaderboardEntry(userAuth, exId, snap.score, userName || "Anonymous", userAvatar || "");
      if (result.isNewRecord) {
        exerciseRecordsRef.current = {
          ...exerciseRecordsRef.current,
          micHighScore: { exerciseTitle: exTitle, score: snap.score, accuracy: snap.accuracy },
        };
      }
    }

    if (userAuth && currentExercise.riddleConfig?.mode === "sequenceRepeat" && earTrainingScore > 0) {
      const result = await updateEarTrainingHighScore(userAuth, exId, earTrainingScore, exTitle, exCategory);
      recordScoredRun({ exerciseId: exId, exerciseTitle: exTitle, score: earTrainingScore, scoreType: "earTraining", previousBest: result.previousScore });
      saveLeaderboardEntry(userAuth, exId, earTrainingScore, userName || "Anonymous", userAvatar || "");
      if (result.isNewRecord) {
        exerciseRecordsRef.current = {
          ...exerciseRecordsRef.current,
          earTrainingHighScore: { exerciseTitle: exTitle, score: earTrainingScore },
        };
      }
    }

    if (userAuth && isClickAnsweredMode(currentExercise.noteHuntConfig?.mode) && snap && snap.score > 0) {
      const result = await updateClickHighScore(userAuth, exId, snap.score, snap.accuracy, exTitle, exCategory);
      recordScoredRun({ exerciseId: exId, exerciseTitle: exTitle, score: snap.score, scoreType: "click", previousBest: result.previousScore });
      saveLeaderboardEntry(userAuth, exId, snap.score, userName || "Anonymous", userAvatar || "");
      if (result.isNewRecord) {
        exerciseRecordsRef.current = {
          ...exerciseRecordsRef.current,
          clickHighScore: { exerciseTitle: exTitle, score: snap.score, accuracy: snap.accuracy },
        };
      }
    }
  };

  return { saveCurrentScores, exerciseRecordsRef, scoredRuns };
}
