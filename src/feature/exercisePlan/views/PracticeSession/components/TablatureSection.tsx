import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { TablatureMeasure } from "../../../types/exercise.types";
import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { AlphaTabScoreViewer } from "./AlphaTabScoreViewer";
import { TablatureMinimapBar } from "./TablatureMinimapBar";
import { TablatureViewer } from "./TablatureViewer";
import { useTablatureRenderData } from "./useTablatureRenderData";

interface TablatureSectionProps {
  activeTablature: TablatureMeasure[];
  rawGpFile?: File;
  showAlphaTabScore: boolean;
  isAudioPlaying: boolean;
  onSeek?: (beatPosition: number) => void;
  onLoopRestart?: (loopStartBeat: number) => void;
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
  isExamMode?: boolean;
}

export const TablatureSection = memo(function TablatureSection({
  activeTablature,
  rawGpFile,
  showAlphaTabScore,
  isAudioPlaying,
  onSeek,
  onLoopRestart,
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
  isExamMode = false,
}: TablatureSectionProps) {
  const { hitNotes, missedNotes } = useNoteMatchingContext();
  const renderData = useTablatureRenderData(activeTablature);
  const { measureEndXs, totalBeats } = renderData;

  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd,   setLoopEnd]   = useState<number | null>(null);
  const [currentBeat, setCurrentBeat] = useState(0);
  const seekedBeatRef    = useRef(0);
  const isRestartingRef  = useRef(false);
  // Populated by TablatureViewer so minimap clicks can update the canvas cursor
  const seekWorkerRef    = useRef<((beat: number) => void) | null>(null);
  // Populated by TablatureViewer with its CSS container width (for viewport beats calc)
  const viewerWidthRef   = useRef(0);

  // Note density per measure (0–1) for minimap density bars
  const measureDensities = useMemo(() => {
    const { renderBeats } = renderData;
    if (measureEndXs.length === 0 || renderBeats.length === 0) return [];
    const ends = measureEndXs[measureEndXs.length - 1] < totalBeats
      ? [...measureEndXs, totalBeats]
      : measureEndXs;
    const counts = new Array(ends.length).fill(0);
    let mi = 0;
    for (const beat of renderBeats) {
      while (mi < ends.length - 1 && beat.offsetX >= ends[mi]) mi++;
      if (!beat.isRest) counts[mi]++;
    }
    const maxCount = Math.max(1, ...counts);
    return counts.map(c => c / maxCount);
  }, [renderData, measureEndXs, totalBeats]);

  // Viewport window in beat-space: mirrors the worker's auto-scroll formula
  const { viewportStart, viewportEnd } = useMemo(() => {
    const w = viewerWidthRef.current;
    if (w === 0 || totalBeats === 0) return { viewportStart: 0, viewportEnd: 0 };
    const dynBW = Math.max(120, Math.min(200, w / 4));
    const beat  = isMetronomePlaying ? currentBeat : seekedBeatRef.current;
    const sx    = Math.max(0, beat * dynBW - w / 4);
    return {
      viewportStart: sx / dynBW,
      viewportEnd:   sx / dynBW + w / dynBW,
    };
  // currentBeat drives re-render every rAF frame; seekedBeatRef is read on demand
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBeat, isMetronomePlaying, totalBeats]);

  // Wrap onSeek to track the last seeked beat for minimap cursor and sync the worker canvas
  const handleSeek = useCallback((beat: number) => {
    seekedBeatRef.current = beat;
    setCurrentBeat(beat);
    seekWorkerRef.current?.(beat);
    onSeek?.(beat);
  }, [onSeek]);

  // Update minimap playhead via rAF while playing; also triggers loop restart when end is reached
  useEffect(() => {
    isRestartingRef.current = false; // clear guard on every effect re-run (new play session)
    if (!isMetronomePlaying || !startTime || countInRemaining > 0) {
      setCurrentBeat(seekedBeatRef.current);
      return;
    }
    let rafId: number;
    const tick = () => {
      const elapsed  = (Date.now() - startTime!) / 1000;
      const rawBeats = seekedBeatRef.current + elapsed * (effectiveBpm / 60);

      // Loop restart: fire once when cursor crosses loopEnd
      if (
        !isRestartingRef.current &&
        onLoopRestart &&
        loopStart !== null && loopEnd !== null && loopEnd > loopStart &&
        rawBeats >= loopEnd
      ) {
        isRestartingRef.current = true;
        seekedBeatRef.current   = loopStart;
        onLoopRestart(loopStart);
        return; // stop this rAF frame; effect will restart after metronome cycles
      }

      let beat: number;
      if (loopStart !== null && loopEnd !== null && loopEnd > loopStart && rawBeats >= loopStart) {
        const loopDur = loopEnd - loopStart;
        const relBeat = rawBeats - loopStart;
        beat = loopStart + (relBeat % loopDur);
      } else {
        beat = totalBeats > 0 ? rawBeats % totalBeats : 0;
      }
      setCurrentBeat(beat);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isMetronomePlaying, startTime, effectiveBpm, totalBeats, countInRemaining, loopStart, loopEnd, onLoopRestart]);

  // Reset loop + beat when exercise changes
  useEffect(() => {
    seekedBeatRef.current = 0;
    setLoopStart(null);
    setLoopEnd(null);
    setCurrentBeat(0);
  }, [tabResetKey]);

  const showMinimap = !showAlphaTabScore && !isExamMode && activeTablature.length > 3 && measureEndXs.length > 0;

  return (
    <div className="relative w-full mb-4 bg-[#0f0f12] rounded-lg">
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
        <div className="px-2 pt-0">
          {showMinimap && (
            <TablatureMinimapBar
              measureEndXs={measureEndXs}
              totalBeats={totalBeats}
              currentBeat={currentBeat}
              loopStart={loopStart}
              loopEnd={loopEnd}
              isPlaying={isMetronomePlaying && countInRemaining === 0}
              onSeek={handleSeek}
              onLoopRangeChange={(s, e) => { setLoopStart(s); setLoopEnd(e); }}
              measureDensities={measureDensities}
              viewportStart={viewportStart}
              viewportEnd={viewportEnd}
            />
          )}
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
            onSeek={handleSeek}
            loopStartBeat={loopStart}
            loopEndBeat={loopEnd}
            seekWorkerRef={seekWorkerRef}
            viewerWidthRef={viewerWidthRef}
          />
        </div>
      )}
    </div>
  );
});
