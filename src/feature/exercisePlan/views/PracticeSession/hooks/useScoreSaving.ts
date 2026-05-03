import type { RefObject } from "react";
import { useRef } from "react";

import { saveLeaderboardEntry, updateEarTrainingHighScore, updateMicHighScore } from "../../../services/bpmProgressService";
import type { Exercise } from "../../../types/exercise.types";
import type { NoteMatchingHandle } from "../contexts/NoteMatchingContext";
import { selectUserAuth, selectUserAvatar, selectUserName } from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";

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
}

export function useScoreSaving({
  activeExercise, currentExercise, isMicEnabled,
  earTrainingScore, noteMatchingHandle,
}: UseScoreSavingOptions) {
  const userAuth   = useAppSelector(selectUserAuth);
  const userName   = useAppSelector(selectUserName);
  const userAvatar = useAppSelector(selectUserAvatar);
  const exerciseRecordsRef = useRef<ScoreRecords>({});

  const saveCurrentScores = async () => {
    const snap       = noteMatchingHandle.current?.snapshot();
    const exId       = activeExercise.id;
    const exTitle    = activeExercise.title;
    const exCategory = activeExercise.category;

    if (userAuth && isMicEnabled && snap && snap.score > 0) {
      const result = await updateMicHighScore(userAuth, exId, snap.score, snap.accuracy, exTitle, exCategory);
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
      saveLeaderboardEntry(userAuth, exId, earTrainingScore, userName || "Anonymous", userAvatar || "");
      if (result.isNewRecord) {
        exerciseRecordsRef.current = {
          ...exerciseRecordsRef.current,
          earTrainingHighScore: { exerciseTitle: exTitle, score: earTrainingScore },
        };
      }
    }
  };

  return { saveCurrentScores, exerciseRecordsRef };
}
