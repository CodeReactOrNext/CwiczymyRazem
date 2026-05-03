import React, { memo } from "react";

import type { TablatureMeasure } from "../../../types/exercise.types";
import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { AlphaTabScoreViewer } from "./AlphaTabScoreViewer";
import { TablatureViewer } from "./TablatureViewer";

interface TablatureSectionProps {
  activeTablature: TablatureMeasure[];
  rawGpFile?: File;
  showAlphaTabScore: boolean;
  onToggleAlphaTabScore: () => void;
  isAudioPlaying: boolean;
  startTime: number | null;
  effectiveBpm: number;
  isAudioMuted: boolean;
  isMetronomePlaying: boolean;
  countInRemaining: number;
  frequencyRef?: React.MutableRefObject<number>;
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
  onToggleAlphaTabScore,
  isAudioPlaying,
  startTime,
  effectiveBpm,
  isAudioMuted,
  isMetronomePlaying,
  countInRemaining,
  frequencyRef,
  audioContext,
  audioStartTime,
  tabResetKey,
  hideNotes,
  hideDynamicsLane,
  volumeRef,
}: TablatureSectionProps) {
  const { hitNotes, missedNotes } = useNoteMatchingContext();

  return (
    <div className="relative w-full my-8 bg-[#0a0a0a] rounded-xl">
      {rawGpFile && (
        <button
          onClick={onToggleAlphaTabScore}
          className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-md bg-black/50 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
          title={showAlphaTabScore ? "Switch to tablature" : "Switch to notation"}
        >
          {showAlphaTabScore ? "TAB" : "♩ Notation"}
        </button>
      )}
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
          isListening={true}
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
