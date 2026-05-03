import { cn } from "assets/lib/utils";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import React, { memo, useEffect, useRef, useState } from "react";

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
}: TablatureViewerProps) => {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const containerRef   = useRef<HTMLDivElement>(null);
  const ambientGlowRef = useRef<HTMLDivElement>(null);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 256 });

  const renderData = useTablatureRenderData(measures);

  const { showRestWarning, handleDragStart, handleDragMove, handleDragEnd } = useTablatureWorkerBridge({
    canvasRef, containerSize, renderData,
    isPlaying, startTime, audioStartTime, bpm, countInRemaining,
    hitNotes, missedNotes, hideNotes, hideDynamicsLane,
    measures, resetKey, audioContext, volumeRef,
  });

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

  return (
    <div
      className={cn(
        "w-full bg-[#0a0a0a] rounded-xl p-4 relative h-[300px] select-none overflow-hidden",
        !isPlaying && "cursor-grab active:cursor-grabbing",
        className,
      )}
      ref={containerRef}
      onMouseDown={(e)  => handleDragStart(e.clientX)}
      onMouseMove={(e)  => handleDragMove(e.clientX)}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
      onTouchMove={(e)  => handleDragMove(e.touches[0].clientX)}
      onTouchEnd={handleDragEnd}
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-20 animate-in fade-in zoom-in duration-300">
          <div className="flex flex-col items-center">
            <span className="text-8xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] animate-bounce">
              {countInRemaining}
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/50 mt-4">
              Get Ready
            </span>
          </div>
        </div>
      )}

      {showRestWarning && countInRemaining === 0 && (
        <div className="absolute top-2 right-3 pointer-events-none z-10">
          <div className="flex items-center gap-1.5 bg-white/8 border border-white/15 text-white/50 text-xs px-3 py-1 rounded-full backdrop-blur-sm">
            <span className="leading-none">𝄽</span>
            <span className="tracking-wider">pauza</span>
          </div>
        </div>
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
  prev.hideDynamicsLane === next.hideDynamicsLane
);
