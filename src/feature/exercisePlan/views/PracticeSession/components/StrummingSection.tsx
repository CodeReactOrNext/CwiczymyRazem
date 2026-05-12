import type { StrumPattern } from "feature/exercisePlan/types/exercise.types";
import { memo } from "react";

import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { StrummingPatternViewer } from "./StrummingPatternViewer";

interface StrummingSectionProps {
  patterns: StrumPattern[];
  bpm: number;
  isPlaying: boolean;
  startTime: number | null;
  countInRemaining: number;
  isMicEnabled?: boolean;
  audioContext?: AudioContext | null;
}

export const StrummingSection = memo(function StrummingSection(props: StrummingSectionProps) {
  const { strumSlotFeedback } = useNoteMatchingContext();
  return <StrummingPatternViewer {...props} slotFeedback={strumSlotFeedback} />;
});
