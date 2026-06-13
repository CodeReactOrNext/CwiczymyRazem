import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { useEffect, useRef, useState } from "react";
import type { MutableRefObject, RefObject } from "react";

import type { TablatureRenderData } from "./useTablatureRenderData";

const REST_VOLUME_THRESHOLD = 0.05;

interface WorkerBridgeOptions {
  canvasRef:       { current: HTMLCanvasElement | null };
  containerRef?:   { current: HTMLElement | null };
  containerSize:   { width: number; height: number };
  renderData:      TablatureRenderData;
  isPlaying:       boolean;
  startTime:       number | null;
  audioStartTime:  number | null | undefined;
  bpm:             number;
  countInRemaining: number;
  hitNotes:        Record<string, boolean | number>;
  missedNotes:     Record<string, boolean>;
  hideNotes:       boolean;
  hideDynamicsLane: boolean;
  measures:        TablatureMeasure[] | undefined;
  resetKey:        number | undefined;
  audioContext:    AudioContext | null | undefined;
  volumeRef:       MutableRefObject<number> | undefined;
  onSeek?:         (beatPosition: number) => void;
  loopStartBeat?:  number | null;
  loopEndBeat?:    number | null;
}

export function useTablatureWorkerBridge({
  canvasRef, containerRef, containerSize, renderData,
  isPlaying, startTime, audioStartTime, bpm, countInRemaining,
  hitNotes, missedNotes, hideNotes, hideDynamicsLane,
  measures, resetKey, audioContext, volumeRef, onSeek,
  loopStartBeat, loopEndBeat,
}: WorkerBridgeOptions) {
  const workerRef           = useRef<Worker | null>(null);
  const transferredRef      = useRef(false);
  const prevStartTimeRef    = useRef<number | null>(startTime);
  const isDraggingRef       = useRef(false);
  const dragStartXRef       = useRef(0);
  const mouseDownXRef       = useRef(0);
  const mouseDownTimeRef    = useRef(0);
  const initScrollXRef      = useRef(0);
  const pausedScrollRef     = useRef({ scrollX: 0, cursorPos: 0 });
  const lastHoverMeasureRef = useRef<number>(-1);

  const [isRestActive,    setIsRestActive]    = useState(false);
  const [showRestWarning, setShowRestWarning] = useState(false);

  // Worker lifecycle
  useEffect(() => {
    const worker = new Worker(new URL('./TablatureViewer.worker.ts', import.meta.url));
    workerRef.current      = worker;
    transferredRef.current = false;
    worker.onmessage = (e: MessageEvent) => {
      if (e.data?.type === 'REST_ACTIVE') setIsRestActive(e.data.isRest);
    };
    return () => { worker.postMessage({ type: 'STOP' }); worker.terminate(); };
  }, []);

  // Canvas transfer (runs once on first valid container size)
  useEffect(() => {
    if (!canvasRef.current || !workerRef.current || transferredRef.current || containerSize.width === 0) return;
    const htmlCanvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    htmlCanvas.width  = containerSize.width  * dpr;
    htmlCanvas.height = containerSize.height * dpr;
    const offscreen = htmlCanvas.transferControlToOffscreen();
    workerRef.current.postMessage(
      { type: 'INIT', canvas: offscreen, dpr, width: containerSize.width, height: containerSize.height },
      [offscreen],
    );
    transferredRef.current = true;
  // canvasRef is a stable ref object — omitted intentionally
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerSize]);

  // Resize
  useEffect(() => {
    if (!transferredRef.current || containerSize.width === 0) return;
    workerRef.current?.postMessage({ type: 'RESIZE', width: containerSize.width, height: containerSize.height, dpr: window.devicePixelRatio || 1 });
  }, [containerSize]);

  // Render data + reset cursor
  useEffect(() => {
    const { renderBeats, measureEndXs, totalBeats, timeSigMarkers, tupletGroups, tempoMap, hasAccentedNotes, hasDynamics } = renderData;
    workerRef.current?.postMessage({
      type: 'DATA', renderBeats, measureEndXs, totalBeats, timeSigMarkers, tupletGroups, tempoMap,
      hasAccentedNotes: hideDynamicsLane ? false : hasAccentedNotes,
      hasDynamics:      hideDynamicsLane ? false : hasDynamics,
    });
    workerRef.current?.postMessage({ type: 'RESET' });
  }, [renderData, hideDynamicsLane]);

  // Playback state
  useEffect(() => {
    workerRef.current?.postMessage({
      type: 'PLAYBACK', isPlaying, bpm, countInRemaining,
      startWallMs:   isPlaying ? startTime     : null,
      audioStartSec: isPlaying ? (audioStartTime ?? null) : null,
    });
  }, [isPlaying, startTime, audioStartTime, bpm, countInRemaining]);

  // Audio-clock tick at ~30fps so the worker can interpolate smooth cursor position
  useEffect(() => {
    if (!isPlaying || !audioContext || countInRemaining > 0) return;
    let rafId: number;
    let lastTick = 0;
    const tick = (ts: number) => {
      if (ts - lastTick >= 33) {
        workerRef.current?.postMessage({ type: 'TICK', audioCurrentSec: audioContext.currentTime });
        lastTick = ts;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, audioContext, countInRemaining]);

  // Clear rest state when stopped
  useEffect(() => {
    if (!isPlaying) { setIsRestActive(false); setShowRestWarning(false); }
  }, [isPlaying]);

  // Poll volume to decide whether to show rest warning overlay
  useEffect(() => {
    if (!isRestActive || !isPlaying || !volumeRef) { setShowRestWarning(false); return; }
    const id = setInterval(() => {
      setShowRestWarning((volumeRef.current ?? 0) > REST_VOLUME_THRESHOLD);
    }, 50);
    return () => clearInterval(id);
  }, [isRestActive, isPlaying, volumeRef]);

  useEffect(() => { workerRef.current?.postMessage({ type: 'SHOW_REST_WARNING', show: showRestWarning }); }, [showRestWarning]);
  useEffect(() => { workerRef.current?.postMessage({ type: 'HIT_NOTES',    hitNotes });   }, [hitNotes]);
  useEffect(() => { workerRef.current?.postMessage({ type: 'MISSED_NOTES', missedNotes }); }, [missedNotes]);
  useEffect(() => { workerRef.current?.postMessage({ type: 'HIDE_NOTES',   hideNotes });  }, [hideNotes]);
  useEffect(() => {
    workerRef.current?.postMessage({
      type: 'LOOP_RANGE',
      startBeat: loopStartBeat ?? null,
      endBeat:   loopEndBeat   ?? null,
    });
  }, [loopStartBeat, loopEndBeat]);

  // Reset cursor when measures or resetKey changes
  useEffect(() => {
    workerRef.current?.postMessage({ type: 'RESET' });
    pausedScrollRef.current = { scrollX: 0, cursorPos: 0 };
  }, [measures, resetKey]);

  // Immediate reset when startTime goes null mid-playback (e.g. count-in restart on BPM change)
  useEffect(() => {
    const prev = prevStartTimeRef.current;
    prevStartTimeRef.current = startTime;
    if (prev !== null && startTime === null && isPlaying) {
      workerRef.current?.postMessage({ type: 'RESET' });
      pausedScrollRef.current = { scrollX: 0, cursorPos: 0 };
    }
  }, [startTime, isPlaying]);

  const handleDragStart = (clientX: number) => {
    if (isPlaying) return;
    isDraggingRef.current    = true;
    dragStartXRef.current    = clientX;
    mouseDownXRef.current    = clientX;
    mouseDownTimeRef.current = Date.now();
    initScrollXRef.current   = pausedScrollRef.current.scrollX;
    // Clear hover preview while dragging
    if (lastHoverMeasureRef.current !== -1) {
      lastHoverMeasureRef.current = -1;
      workerRef.current?.postMessage({ type: 'HOVER', startX: null });
    }
  };
  const handleDragMove = (clientX: number) => {
    if (!isDraggingRef.current) return;
    const newScrollX = Math.max(0, initScrollXRef.current - (clientX - dragStartXRef.current));
    pausedScrollRef.current = { ...pausedScrollRef.current, scrollX: newScrollX };
    workerRef.current?.postMessage({ type: 'SCROLL', scrollX: newScrollX, cursorPos: pausedScrollRef.current.cursorPos });
  };
  const handleDragEnd = (clientX?: number) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    if (
      clientX !== undefined &&
      onSeek &&
      containerRef?.current &&
      Math.abs(clientX - mouseDownXRef.current) < 5 &&
      Date.now() - mouseDownTimeRef.current < 400
    ) {
      const containerLeft = containerRef.current.getBoundingClientRect().left;
      const dynBW = Math.max(120, Math.min(200, containerSize.width / 4));
      const worldX = (clientX - containerLeft) + pausedScrollRef.current.scrollX;
      let beatPos = Math.max(0, worldX / dynBW);

      // Snap to start of the measure that was clicked
      const ends = renderData.measureEndXs;
      if (ends.length > 0) {
        let measureStart = 0;
        for (let i = 0; i < ends.length; i++) {
          if (beatPos < ends[i]) break;
          measureStart = ends[i];
        }
        beatPos = measureStart;
      }

      const newCursorPos = beatPos * dynBW;
      const newScrollX   = Math.max(0, newCursorPos - containerSize.width / 4);
      pausedScrollRef.current = { scrollX: newScrollX, cursorPos: newCursorPos };
      workerRef.current?.postMessage({ type: 'SCROLL', scrollX: newScrollX, cursorPos: newCursorPos });
      // Clear hover preview after seek click
      lastHoverMeasureRef.current = -1;
      workerRef.current?.postMessage({ type: 'HOVER', startX: null });

      onSeek(beatPos);
    }
  };

  const handleHover = (clientX: number) => {
    if (isPlaying || isDraggingRef.current || !containerRef?.current || !onSeek) return;
    const containerLeft = containerRef.current.getBoundingClientRect().left;
    const dynBW = Math.max(120, Math.min(200, containerSize.width / 4));
    const worldX = (clientX - containerLeft) + pausedScrollRef.current.scrollX;
    const beatPos = Math.max(0, worldX / dynBW);

    // Find which measure start this position snaps to
    const ends = renderData.measureEndXs;
    let measureStart = 0;
    for (let i = 0; i < ends.length; i++) {
      if (beatPos < ends[i]) break;
      measureStart = ends[i];
    }

    // Only send message when hovered measure changes
    if (measureStart === lastHoverMeasureRef.current) return;
    lastHoverMeasureRef.current = measureStart;
    workerRef.current?.postMessage({ type: 'HOVER', startX: measureStart * dynBW });
  };

  const handleHoverEnd = () => {
    if (lastHoverMeasureRef.current === -1) return;
    lastHoverMeasureRef.current = -1;
    workerRef.current?.postMessage({ type: 'HOVER', startX: null });
  };

  const resetSeek = () => {
    pausedScrollRef.current = { scrollX: 0, cursorPos: 0 };
    workerRef.current?.postMessage({ type: 'SCROLL', scrollX: 0, cursorPos: 0 });
    lastHoverMeasureRef.current = -1;
    workerRef.current?.postMessage({ type: 'HOVER', startX: null });
    onSeek?.(0);
  };

  // Seek the worker canvas position without going through the canvas click handler.
  // Called by TablatureSection when the minimap is clicked (to keep both in sync).
  const seekWorker = (beat: number) => {
    const dynBW = Math.max(120, Math.min(200, containerSize.width / 4));
    const newCursorPos = beat * dynBW;
    const newScrollX   = Math.max(0, newCursorPos - containerSize.width / 4);
    pausedScrollRef.current = { scrollX: newScrollX, cursorPos: newCursorPos };
    workerRef.current?.postMessage({ type: 'SCROLL', scrollX: newScrollX, cursorPos: newCursorPos });
    lastHoverMeasureRef.current = -1;
    workerRef.current?.postMessage({ type: 'HOVER', startX: null });
  };

  return { showRestWarning, isRestActive, handleDragStart, handleDragMove, handleDragEnd, handleHover, handleHoverEnd, resetSeek, seekWorker };
}
