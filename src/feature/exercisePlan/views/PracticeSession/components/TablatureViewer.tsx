import { cn } from "assets/lib/utils";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { SkipBack } from "lucide-react";
import React, { memo, useEffect, useRef, useState } from "react";

import { CountInOverlay } from "./CountInOverlay";
import { useAmbientMicGlow } from "./useAmbientMicGlow";
import { useTablatureRenderData } from "./useTablatureRenderData";
import type { TablatureStylePatch, TuningGutterString } from "./useTablatureWorkerBridge";
import { TAB_BASE_HEIGHT, useTablatureWorkerBridge } from "./useTablatureWorkerBridge";

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
  /** Current playhead position in beats — drives the "From the start" button
   *  whenever paused away from 0, whether that's from a manual seek or just
   *  having played partway through. */
  currentBeat?: number;
  loopStartBeat?: number | null;
  loopEndBeat?: number | null;
  /** Populated by the viewer so callers (e.g. minimap) can drive the canvas cursor without a canvas click */
  seekWorkerRef?: React.MutableRefObject<((beat: number) => void) | null>;
  /** Populated with the CSS pixel width of the canvas container so parent can derive viewport beats */
  viewerWidthRef?: React.MutableRefObject<number>;
  /** Horizontal zoom multiplier for the score (1 = default). */
  zoom?: number;
  /** Viewer height in px — the score scales with it (base 300px). */
  heightPx?: number;
  /** Per-string tuning legend for the left gutter (string 1 = high e … 6 = low E).
   *  Passed only from the practice session; omit elsewhere to keep the plain tab. */
  tuningStrings?: TuningGutterString[];
  /** Look settings forwarded to the worker (pill shape, colours, visible layers). */
  style?: TablatureStylePatch;
  /** Per-string fret-pill colours. Baked into the render data, so it must be
   *  passed here — the worker only uses its own copy for slide lines. */
  palette?: readonly string[];
  /** Ambient mic-reactive glow under the tab. Defaults to on when a volumeRef is given. */
  ambientGlow?: boolean;
  /** Light board — flips the HTML chips drawn over the canvas so they stay readable. */
  isLightBoard?: boolean;
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
  currentBeat = 0,
  loopStartBeat,
  loopEndBeat,
  seekWorkerRef,
  viewerWidthRef,
  zoom = 1,
  heightPx = TAB_BASE_HEIGHT,
  tuningStrings,
  style,
  ambientGlow = true,
  palette,
  isLightBoard = false,
}: TablatureViewerProps) => {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const containerRef   = useRef<HTMLDivElement>(null);
  const ambientGlowRef = useRef<HTMLDivElement>(null);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 256 });

  // The worker maps noteY back to a string index, so it must receive the very
  // same spacing this render data was built with (both come from `style`).
  const renderData = useTablatureRenderData(measures, palette, style?.stringSpacing);

  const { showRestWarning, handleDragStart, handleDragMove, handleDragEnd, handleHover, handleHoverEnd, resetSeek, seekWorker } = useTablatureWorkerBridge({
    canvasRef, containerRef, containerSize, renderData,
    isPlaying, startTime, audioStartTime, bpm, countInRemaining,
    hitNotes, missedNotes, hideNotes, hideDynamicsLane,
    measures, resetKey, audioContext, volumeRef, onSeek,
    loopStartBeat, loopEndBeat, zoom, tuningStrings, style,
  });

  // Expose seekWorker so parent (TablatureSection minimap) can drive the canvas cursor
  useEffect(() => {
    if (seekWorkerRef) seekWorkerRef.current = seekWorker;
  }, [seekWorkerRef, seekWorker]);

  // Expose CSS container width so parent can compute viewport beats for the minimap
  useEffect(() => {
    if (viewerWidthRef) viewerWidthRef.current = containerSize.width;
  }, [viewerWidthRef, containerSize.width]);

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

  // Not just "seeked away from 0" — also true after simply playing partway
  // through and pausing, so the button is there whenever it's actually useful.
  const showReset = !isPlaying && !!onSeek && currentBeat > 0.01;

  return (
    <div
      className={cn(
        "w-full px-4 pb-4 pt-0 relative select-none overflow-hidden",
        !isPlaying && onSeek && "cursor-pointer",
        !isPlaying && !onSeek && "cursor-grab active:cursor-grabbing",
        className,
      )}
      style={{ height: heightPx, backgroundColor: style?.background ?? "#09090b" }}
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

      {volumeRef && ambientGlow && (
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

      <CountInOverlay count={countInRemaining} bpm={bpm} />

      {showRestWarning && countInRemaining === 0 && (
        <div className="absolute top-2 right-3 pointer-events-none z-10">
          <div className={cn(
            "flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg backdrop-blur-sm",
            isLightBoard ? "bg-black/5 text-zinc-600" : "bg-white/8 text-white/50",
          )}>
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
  prev.currentBeat      === next.currentBeat        &&
  prev.loopStartBeat    === next.loopStartBeat      &&
  prev.loopEndBeat      === next.loopEndBeat         &&
  prev.zoom             === next.zoom               &&
  prev.heightPx         === next.heightPx           &&
  prev.tuningStrings    === next.tuningStrings      &&
  prev.style            === next.style              &&
  prev.ambientGlow      === next.ambientGlow        &&
  prev.palette          === next.palette            &&
  prev.isLightBoard     === next.isLightBoard
);
