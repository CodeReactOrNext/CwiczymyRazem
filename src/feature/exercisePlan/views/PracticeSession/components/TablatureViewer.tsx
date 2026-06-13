import { cn } from "assets/lib/utils";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { SkipBack } from "lucide-react";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";

import { useAmbientMicGlow } from "./useAmbientMicGlow";
import { useTablatureRenderData } from "./useTablatureRenderData";
import { useTablatureWorkerBridge } from "./useTablatureWorkerBridge";

interface TablatureViewerProps {
  measures?: TablatureMeasure[];
  bpm: number;
  isPlaying: boolean;
  startTime: number | null;
  countInRemaining?: number;
  className?: string;
  frequencyRef?: React.MutableRefObject<number>;
  isListening?: boolean;
  hitNotes?: Record<string, boolean | number>;
  missedNotes?: Record<string, boolean>;
  currentBeatsElapsed?: number;
  hideNotes?: boolean;
  audioContext?: AudioContext | null;
  audioStartTime?: number | null;
  resetKey?: number;
  hideDynamicsLane?: boolean;
  volumeRef?: React.MutableRefObject<number>;
  onSeek?: (beatPosition: number) => void;
  loopStartBeat?: number | null;
  loopEndBeat?: number | null;
  /** Populated by the viewer so callers (e.g. minimap) can drive the canvas cursor without a canvas click */
  seekWorkerRef?: React.MutableRefObject<((beat: number) => void) | null>;
  /** Populated with the CSS pixel width of the canvas container so parent can derive viewport beats */
  viewerWidthRef?: React.MutableRefObject<number>;
}

const TablatureViewerInner = ({
  measures,
  bpm,
  isPlaying,
  startTime,
  countInRemaining = 0,
  className,
  frequencyRef,
  hitNotes = {},
  missedNotes = {},
  hideNotes = false,
  audioContext,
  audioStartTime,
  resetKey,
  hideDynamicsLane = false,
  volumeRef,
  onSeek,
  loopStartBeat,
  loopEndBeat,
  seekWorkerRef,
  viewerWidthRef,
}: TablatureViewerProps) => {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const containerRef   = useRef<HTMLDivElement>(null);
  const ambientGlowRef = useRef<HTMLDivElement>(null);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 256 });
  const [hasSeek, setHasSeek] = useState(false);

  const renderData = useTablatureRenderData(measures);

  // Wrap onSeek to track local seek state
  const handleSeekWithTracking = useCallback((beat: number) => {
    setHasSeek(beat > 0);
    onSeek?.(beat);
  }, [onSeek]);

  const { showRestWarning, handleDragStart, handleDragMove, handleDragEnd, handleHover, handleHoverEnd, resetSeek, seekWorker } = useTablatureWorkerBridge({
    canvasRef, containerRef, containerSize, renderData,
    isPlaying, startTime, audioStartTime, bpm, countInRemaining,
    hitNotes, missedNotes, hideNotes, hideDynamicsLane,
    measures, resetKey, audioContext, volumeRef, onSeek: handleSeekWithTracking,
    loopStartBeat, loopEndBeat,
  });

  // Expose seekWorker so parent (TablatureSection minimap) can drive the canvas cursor
  useEffect(() => {
    if (seekWorkerRef) seekWorkerRef.current = seekWorker;
  }, [seekWorkerRef, seekWorker]);

  // Expose CSS container width so parent can compute viewport beats for the minimap
  useEffect(() => {
    if (viewerWidthRef) viewerWidthRef.current = containerSize.width;
  }, [viewerWidthRef, containerSize.width]);

  // Sync hasSeek with isPlaying — if playing starts, seek is "consumed"
  useEffect(() => {
    if (isPlaying) setHasSeek(false);
  }, [isPlaying]);

  useAmbientMicGlow(ambientGlowRef, volumeRef, frequencyRef);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setContainerSize({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const showReset = hasSeek && !isPlaying && !!onSeek;

  return (
    <div
      className={cn(
        "w-full bg-[#09090b] px-4 pb-4 pt-0 relative h-[300px] select-none overflow-hidden",
        !isPlaying && onSeek && "cursor-pointer",
        !isPlaying && !onSeek && "cursor-grab active:cursor-grabbing",
        className,
      )}
      ref={containerRef}
      onMouseDown={(e)  => handleDragStart(e.clientX)}
      onMouseMove={(e)  => { handleDragMove(e.clientX); handleHover(e.clientX); }}
      onMouseUp={(e)    => handleDragEnd(e.clientX)}
      onMouseLeave={(e) => { handleDragEnd(e.clientX); handleHoverEnd(); }}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
      onTouchMove={(e)  => handleDragMove(e.touches[0].clientX)}
      onTouchEnd={(e)   => handleDragEnd(e.changedTouches[0]?.clientX)}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", position: "relative", zIndex: 10 }} />

      {volumeRef && (
        <div
          ref={ambientGlowRef}
          className="absolute inset-x-0 bottom-0 pointer-events-none mix-blend-screen opacity-0"
          style={{
            height: '150%',
            background: 'radial-gradient(circle at 50% 100%, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 50%, transparent 80%)',
            transformOrigin: 'bottom',
            zIndex: 1,
            transition: 'opacity 50ms linear, transform 50ms linear',
          }}
        />
      )}

      {countInRemaining > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 animate-in fade-in zoom-in duration-200">
          <div className="flex flex-col items-center">
            <span className="text-8xl font-black text-white drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
              {countInRemaining}
            </span>
            <span className="text-xs font-bold tracking-[0.3em] text-white/50 mt-4">
              Get Ready
            </span>
          </div>
        </div>
      )}

      {showRestWarning && countInRemaining === 0 && (
        <div className="absolute top-2 right-3 pointer-events-none z-10">
          <div className="flex items-center gap-1.5 bg-white/8 text-white/50 text-xs px-3 py-1 rounded-lg backdrop-blur-sm">
            <span className="leading-none">𝄽</span>
            <span className="tracking-wider">pauza</span>
          </div>
        </div>
      )}

      {showReset && (
        <button
          onClick={(e) => { e.stopPropagation(); resetSeek(); }}
          className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded-lg bg-zinc-900/85 px-3 py-1.5 text-[10px] font-semibold text-zinc-400 backdrop-blur-sm hover:bg-zinc-800 hover:text-white transition-colors border border-white/10"
        >
          <SkipBack className="h-3 w-3" />
          From the start
        </button>
      )}
    </div>
  );
};

export const TablatureViewer = memo(TablatureViewerInner, (prev, next) =>
  Object.is(prev.measures,     next.measures)      &&
  prev.bpm              === next.bpm               &&
  prev.isPlaying        === next.isPlaying          &&
  prev.startTime        === next.startTime          &&
  prev.audioStartTime   === next.audioStartTime     &&
  prev.countInRemaining === next.countInRemaining   &&
  prev.hideNotes        === next.hideNotes          &&
  prev.resetKey         === next.resetKey           &&
  prev.className        === next.className          &&
  prev.hitNotes         === next.hitNotes           &&
  prev.missedNotes      === next.missedNotes        &&
  prev.hideDynamicsLane === next.hideDynamicsLane   &&
  prev.loopStartBeat    === next.loopStartBeat      &&
  prev.loopEndBeat      === next.loopEndBeat
);
