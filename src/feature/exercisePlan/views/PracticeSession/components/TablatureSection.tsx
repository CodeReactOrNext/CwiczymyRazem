import React, { memo } from "react";

import type { TablatureMeasure } from "../../../types/exercise.types";
import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { AlphaTabScoreViewer } from "./AlphaTabScoreViewer";
import { TablatureViewer } from "./TablatureViewer";

interface TablatureSectionProps {
  activeTablature: TablatureMeasure[];
  rawGpFile?: File;
  showAlphaTabScore: boolean;
  isAudioPlaying: boolean;
  startTime: number | null;
  effectiveBpm: number;
  isAudioMuted: boolean;
  isMetronomePlaying: boolean;
  countInRemaining: number;
  frequencyRef?: React.MutableRefObject<number>;
  isListening: boolean;
  audioContext?: AudioContext | null;
  audioStartTime?: number | null;
  tabResetKey: number;
  hideNotes?: boolean;
  hideDynamicsLane: boolean;
  volumeRef?: React.MutableRefObject<number>;
}

export const TablatureSection = memo(function TablatureSection({
  activeTablature,
  rawGpFile,
  showAlphaTabScore,
  isAudioPlaying,
  startTime,
  effectiveBpm,
  isAudioMuted,
  isMetronomePlaying,
  countInRemaining,
  frequencyRef,
  isListening,
  audioContext,
  audioStartTime,
  tabResetKey,
  hideNotes,
  hideDynamicsLane,
  volumeRef,
}: TablatureSectionProps) {
  const { hitNotes, missedNotes } = useNoteMatchingContext();

  return (
    <div className="relative w-full my-8 bg-[#0f0f12] rounded-lg">
      {showAlphaTabScore && rawGpFile ? (
        <AlphaTabScoreViewer
          rawGpFile={rawGpFile}
          mode="score"
          isPlaying={isAudioPlaying}
          startTime={startTime}
          bpm={effectiveBpm}
          volume={isAudioMuted ? 0 : 1}
          className="w-full"
        />
      ) : (
        <TablatureViewer
          measures={activeTablature}
          bpm={effectiveBpm}
          isPlaying={isMetronomePlaying}
          startTime={startTime}
          countInRemaining={countInRemaining}
          className="w-full"
          frequencyRef={frequencyRef}
          isListening={isListening}
          hitNotes={hitNotes}
          missedNotes={missedNotes}
          currentBeatsElapsed={0}
          hideNotes={hideNotes}
          audioContext={audioContext}
          audioStartTime={audioStartTime}
          resetKey={tabResetKey}
          hideDynamicsLane={hideDynamicsLane}
          volumeRef={volumeRef}
        />
      )}
    </div>
  );
});
