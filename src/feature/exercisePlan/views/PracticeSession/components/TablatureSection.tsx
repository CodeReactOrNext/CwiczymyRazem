import { ZoomIn, ZoomOut } from "lucide-react";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { TablatureMeasure } from "../../../types/exercise.types";
import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { AlphaTabScoreViewer } from "./AlphaTabScoreViewer";
import { TablatureMinimapBar } from "./TablatureMinimapBar";
import { TablatureViewer } from "./TablatureViewer";
import { useTablatureRenderData } from "./useTablatureRenderData";

const ZOOM_MIN = 0.3;
const ZOOM_MAX = 1.75;
const ZOOM_STEP = 0.25;
const ZOOM_STORAGE_KEY = "practice-tab-zoom";

const clampZoom = (z: number) =>
  Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z)) * 100) / 100;

const loadZoom = (): number => {
  if (typeof window === "undefined") return 1;
  const raw = window.localStorage.getItem(ZOOM_STORAGE_KEY);
  const parsed = raw ? parseFloat(raw) : NaN;
  return isNaN(parsed) ? 1 : clampZoom(parsed);
};

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
  const [zoom, setZoom] = useState<number>(loadZoom);

  const handleZoomChange = useCallback((next: number) => {
    const clamped = clampZoom(next);
    setZoom(clamped);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ZOOM_STORAGE_KEY, String(clamped));
    }
  }, []);
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
    const dynBW = Math.max(120, Math.min(200, w / 4)) * zoom;
    const beat  = isMetronomePlaying ? currentBeat : seekedBeatRef.current;
    const sx    = Math.max(0, beat * dynBW - w / 4);
    return {
      viewportStart: sx / dynBW,
      viewportEnd:   sx / dynBW + w / dynBW,
    };
  // currentBeat drives re-render every rAF frame; seekedBeatRef is read on demand
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBeat, isMetronomePlaying, totalBeats, zoom]);

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
          <div className="relative">
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
              zoom={zoom}
            />
            <TablatureZoomControl zoom={zoom} onChange={handleZoomChange} />
          </div>
        </div>
      )}
    </div>
  );
});

interface TablatureZoomControlProps {
  zoom: number;
  onChange: (next: number) => void;
}

/** Floating zoom control over the tablature — compress the score to see more at once, or enlarge it. */
function TablatureZoomControl({ zoom, onChange }: TablatureZoomControlProps) {
  const atMin = zoom <= ZOOM_MIN + 1e-6;
  const atMax = zoom >= ZOOM_MAX - 1e-6;
  const btn =
    "flex h-7 w-7 items-center justify-center rounded-md text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div className="absolute bottom-3 right-3 z-20 flex items-center gap-0.5 rounded-lg border border-white/10 bg-zinc-900/85 px-1 py-1 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => onChange(zoom - ZOOM_STEP)}
        disabled={atMin}
        title="Zoom out — see more of the exercise"
        aria-label="Zoom out"
        className={btn}
      >
        <ZoomOut className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onChange(1)}
        title="Reset zoom"
        aria-label="Reset zoom"
        className="min-w-[3rem] rounded-md px-1.5 text-center font-mono text-[11px] font-semibold tabular-nums text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        onClick={() => onChange(zoom + ZOOM_STEP)}
        disabled={atMax}
        title="Zoom in — enlarge the notes"
        aria-label="Zoom in"
        className={btn}
      >
        <ZoomIn className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
