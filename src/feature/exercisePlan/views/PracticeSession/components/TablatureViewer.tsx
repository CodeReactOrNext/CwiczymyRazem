import { useEffect, useRef, useState, useMemo, memo } from "react";
import { cn } from "assets/lib/utils";
import { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { NoteData } from "utils/audio/noteUtils";

interface TablatureViewerProps {
  measures?: TablatureMeasure[];
  bpm: number;
  isPlaying: boolean;
  startTime: number | null;
  countInRemaining?: number;
  className?: string;
  detectedNote?: NoteData | null;
  isListening?: boolean;
  hitNotes?: Record<string, boolean>;
  missedNotes?: Record<string, boolean>;
  currentBeatsElapsed?: number;
  hideNotes?: boolean;
  audioContext?: AudioContext | null;
  audioStartTime?: number | null;
  resetKey?: number;
  hideDynamicsLane?: boolean;
}

// ── Pre-computed per-beat types (shared with worker via postMessage) ──────────
interface NoteRD {
  noteKey: string;
  noteY: number;
  fret: number;
  color: string;
  isAccented?: boolean;
  isHammerOn?: boolean;
  isPullOff?: boolean;
  isBend?: boolean;
  bendSemitones?: number;
  isPreBend?: boolean;
  isRelease?: boolean;
  isVibrato?: boolean;
  isTap?: boolean;
  dynamics?: number;
  // Extended techniques
  isDead?: boolean;
  isGhost?: boolean;
  isPalmMute?: boolean;
  isLetRing?: boolean;
  isStaccato?: boolean;
  harmonicType?: number;
  slideIn?: number;
  slideOut?: number;
}

interface BeatRD {
  offsetX: number;
  duration: number;
  topNoteY: number;
  chordName?: string;
  beamRight: boolean;
  beamRight2: boolean;
  prevBeamRight: boolean;
  prevBeamRight2: boolean;
  notes: NoteRD[];
  isRest: boolean;
  tuplet?: number;
}

interface TimeSigMarker { x: number; sig: [number, number]; }
interface TupletGroup   { x1: number; x2: number; num: number; }
interface TempoPoint    { beatPos: number; ratio: number; }

const STRING_SPACING = 32;
const NOTE_RADIUS    = 11;
const STAFF_TOP      = 85;
const STRING_COLORS  = ["#f87171", "#fb923c", "#facc15", "#4ade80", "#60a5fa", "#c084fc"] as const;

const TablatureViewerInner = ({
  measures,
  bpm,
  isPlaying,
  startTime,
  countInRemaining = 0,
  className,
  detectedNote: _detectedNote,
  isListening: _isListening,
  hitNotes = {},
  missedNotes = {},
  currentBeatsElapsed: _currentBeatsElapsed,
  hideNotes = false,
  audioContext,
  audioStartTime,
  resetKey,
  hideDynamicsLane = false,
}: TablatureViewerProps) => {
  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const containerRef     = useRef<HTMLDivElement>(null);
  const workerRef        = useRef<Worker | null>(null);
  const transferredRef   = useRef(false);
  const prevStartTimeRef = useRef<number | null>(startTime);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 256 });

  // Scrub state — only used when paused; sent to worker via SCROLL msg
  const isDraggingRef  = useRef(false);
  const dragStartXRef  = useRef(0);
  const initScrollXRef = useRef(0);
  const pausedScrollRef = useRef({ scrollX: 0, cursorPos: 0 });

  const handleDragStart = (clientX: number) => {
    if (isPlaying) return;
    isDraggingRef.current  = true;
    dragStartXRef.current  = clientX;
    initScrollXRef.current = pausedScrollRef.current.scrollX;
  };
  const handleDragMove = (clientX: number) => {
    if (!isDraggingRef.current) return;
    const newScrollX = Math.max(0, initScrollXRef.current - (clientX - dragStartXRef.current));
    pausedScrollRef.current = { ...pausedScrollRef.current, scrollX: newScrollX };
    workerRef.current?.postMessage({ type: 'SCROLL', scrollX: newScrollX, cursorPos: pausedScrollRef.current.cursorPos });
  };
  const handleDragEnd = () => { isDraggingRef.current = false; };

  // ── Pre-compute render data (only when measures change) ────────────────────
  const { totalBeats, renderBeats, measureEndXs, timeSigMarkers, tupletGroups, tempoMap, hasAccentedNotes, hasDynamics } = useMemo(() => {
    if (!measures) return {
      totalBeats: 1, renderBeats: [] as BeatRD[], measureEndXs: [] as number[],
      timeSigMarkers: [] as TimeSigMarker[], tupletGroups: [] as TupletGroup[],
      tempoMap: [] as TempoPoint[],
      hasAccentedNotes: false, hasDynamics: false,
    };

    let currentX = 0;
    const renderBeats: BeatRD[] = [];
    const measureEndXs: number[] = [];
    const timeSigMarkers: TimeSigMarker[] = [];
    const tupletGroups: TupletGroup[] = [];
    let hasAccents = false, hasDyn = false;
    let prevSig: [number, number] | null = null;
    let activeTuplet: { num: number; x1: number; x2: number } | null = null;

    measures.forEach((measure, mIdx) => {
      // Time signature marker — emit only when sig changes between measures
      const sig = measure.timeSignature;
      if (!prevSig || prevSig[0] !== sig[0] || prevSig[1] !== sig[1]) {
        timeSigMarkers.push({ x: currentX, sig });
        prevSig = sig;
      }

      measure.beats.forEach((beat, bIdx) => {
        const next = measure.beats[bIdx + 1];
        const beatStartX = currentX;

        const notes: NoteRD[] = beat.notes.map((note, nIdx) => {
          if (note.isAccented)             hasAccents = true;
          if (note.dynamics !== undefined) hasDyn     = true;
          return {
            noteKey:      `${mIdx}-${bIdx}-${nIdx}`,
            noteY:        STAFF_TOP + (note.string - 1) * STRING_SPACING,
            fret:         note.fret,
            color:        STRING_COLORS[note.string - 1] ?? "#ffffff",
            isAccented:   note.isAccented,
            isHammerOn:   note.isHammerOn,
            isPullOff:    note.isPullOff,
            isBend:       note.isBend,
            bendSemitones: note.bendSemitones,
            isPreBend:    note.isPreBend,
            isRelease:    note.isRelease,
            isVibrato:    note.isVibrato,
            isTap:        note.isTap,
            dynamics:     note.dynamics,
            isDead:       note.isDead,
            isGhost:      note.isGhost,
            isPalmMute:   note.isPalmMute,
            isLetRing:    note.isLetRing,
            isStaccato:   note.isStaccato,
            harmonicType: note.harmonicType,
            slideIn:      note.slideIn,
            slideOut:     note.slideOut,
          };
        });

        const topString = beat.notes.length > 0 ? Math.min(...beat.notes.map(n => n.string)) : 1;

        renderBeats.push({
          offsetX:        currentX,
          duration:       beat.duration,
          topNoteY:       STAFF_TOP + (topString - 1) * STRING_SPACING,
          chordName:      beat.chordName,
          beamRight:      beat.duration <= 0.5  && !!next && next.duration <= 0.5,
          beamRight2:     beat.duration <= 0.25 && !!next && next.duration <= 0.25,
          prevBeamRight:  false,
          prevBeamRight2: false,
          notes,
          isRest: beat.notes.length === 0,
          tuplet: beat.tuplet,
        });

        currentX += beat.duration;

        // Tuplet group tracking
        const tupNum = beat.tuplet ?? null;
        if (tupNum !== null) {
          if (!activeTuplet || activeTuplet.num !== tupNum) {
            if (activeTuplet) tupletGroups.push({ ...activeTuplet });
            activeTuplet = { num: tupNum, x1: beatStartX, x2: currentX };
          } else {
            activeTuplet.x2 = currentX;
          }
        } else if (activeTuplet) {
          tupletGroups.push({ ...activeTuplet });
          activeTuplet = null;
        }
      });

      // Close open tuplet group at measure boundary
      if (activeTuplet) {
        tupletGroups.push({ ...activeTuplet });
        activeTuplet = null;
      }
      measureEndXs.push(currentX);
    });

    for (let i = 1; i < renderBeats.length; i++) {
      renderBeats[i].prevBeamRight  = renderBeats[i - 1].beamRight;
      renderBeats[i].prevBeamRight2 = renderBeats[i - 1].beamRight2;
    }

    // Tempo map — only entries where ratio changes (for cursor sync with AlphaTabPlayer)
    const tempoMap: TempoPoint[] = [];
    let posX = 0;
    measures.forEach(m => {
      if (m.tempoChange !== undefined) tempoMap.push({ beatPos: posX, ratio: m.tempoChange });
      posX += m.beats.reduce((s, b) => s + b.duration, 0);
    });

    return { totalBeats: currentX, renderBeats, measureEndXs, timeSigMarkers, tupletGroups, tempoMap, hasAccentedNotes: hasAccents, hasDynamics: hasDyn };
  }, [measures, hideDynamicsLane]);

  // ── Create worker once ────────────────────────────────────────────────────
  useEffect(() => {
    const worker = new Worker(new URL('./TablatureViewer.worker.ts', import.meta.url));
    workerRef.current    = worker;
    transferredRef.current = false;
    return () => {
      worker.postMessage({ type: 'STOP' });
      worker.terminate();
    };
  }, []);

  // ── Transfer canvas to worker on first valid size ─────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !workerRef.current || transferredRef.current || containerSize.width === 0) return;
    const htmlCanvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    // Set intrinsic size before transfer (can't be changed from main thread after)
    htmlCanvas.width  = containerSize.width  * dpr;
    htmlCanvas.height = containerSize.height * dpr;
    const offscreen = htmlCanvas.transferControlToOffscreen();
    workerRef.current.postMessage(
      { type: 'INIT', canvas: offscreen, dpr, width: containerSize.width, height: containerSize.height },
      [offscreen],
    );
    transferredRef.current = true;
  }, [containerSize]);

  // ── Resize ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!transferredRef.current || containerSize.width === 0) return;
    workerRef.current?.postMessage({
      type: 'RESIZE',
      width:  containerSize.width,
      height: containerSize.height,
      dpr:    window.devicePixelRatio || 1,
    });
  }, [containerSize]);

  // ── Send render data ──────────────────────────────────────────────────────
  useEffect(() => {
    const finalDynamics = hideDynamicsLane ? false : hasDynamics;
    const finalAccents = hideDynamicsLane ? false : hasAccentedNotes;
    workerRef.current?.postMessage({ type: 'DATA', renderBeats, measureEndXs, totalBeats, hasAccentedNotes: finalAccents, hasDynamics: finalDynamics, timeSigMarkers, tupletGroups, tempoMap });
    workerRef.current?.postMessage({ type: 'RESET' });
  }, [renderBeats, measureEndXs, totalBeats, hasAccentedNotes, hasDynamics, timeSigMarkers, tupletGroups, tempoMap, hideDynamicsLane]);

  // ── Playback state ────────────────────────────────────────────────────────
  useEffect(() => {
    workerRef.current?.postMessage({
      type: 'PLAYBACK',
      isPlaying,
      startWallMs: isPlaying ? startTime : null,
      audioStartSec: isPlaying ? (audioStartTime ?? null) : null,
      bpm,
      countInRemaining,
    });
  }, [isPlaying, startTime, audioStartTime, bpm, countInRemaining]);

  // ── Audio-clock TICK: send AudioContext.currentTime at ~10fps so the worker
  //    can interpolate smooth position without flooding the message channel. ──
  useEffect(() => {
    if (!isPlaying || !audioContext || countInRemaining > 0) return;
    let rafId: number;
    let lastTick = 0;
    const tick = (ts: number) => {
      if (ts - lastTick >= 33) { // ~30fps — worker interpolates between ticks
        workerRef.current?.postMessage({ type: 'TICK', audioCurrentSec: audioContext.currentTime });
        lastTick = ts;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, audioContext, countInRemaining]);

  // ── Hit notes ─────────────────────────────────────────────────────────────
  useEffect(() => {
    workerRef.current?.postMessage({ type: 'HIT_NOTES', hitNotes });
  }, [hitNotes]);

  // ── Missed notes ──────────────────────────────────────────────────────────
  useEffect(() => {
    workerRef.current?.postMessage({ type: 'MISSED_NOTES', missedNotes });
  }, [missedNotes]);

  // ── Hide notes ────────────────────────────────────────────────────────────
  useEffect(() => {
    workerRef.current?.postMessage({ type: 'HIDE_NOTES', hideNotes });
  }, [hideNotes]);

  // ── Reset cursor ──────────────────────────────────────────────────────────
  useEffect(() => {
    workerRef.current?.postMessage({ type: 'RESET' });
    pausedScrollRef.current = { scrollX: 0, cursorPos: 0 };
  }, [measures, resetKey]);

  // ── Immediate reset when a restart is triggered during playback ───────────
  // startTime going null while playing = count-in restart (e.g. BPM change).
  // Reset cursor to 0 right away so it doesn't stay frozen at the old position.
  useEffect(() => {
    const prev = prevStartTimeRef.current;
    prevStartTimeRef.current = startTime;
    if (prev !== null && startTime === null && isPlaying) {
      workerRef.current?.postMessage({ type: 'RESET' });
      pausedScrollRef.current = { scrollX: 0, cursorPos: 0 };
    }
  }, [startTime, isPlaying]);

  // ── Container size ────────────────────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setContainerSize({
          width:  containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
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
      {/* Canvas is owned by the worker after INIT — no React drawing here */}
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />

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
    </div>
  );
};

// Memo comparator — re-render when any prop that drives a useEffect or render changes.
// hitNotes IS included to keep the worker in sync via useEffect.
// audioStartTime IS included so the worker gets the updated anchor on each AlphaTab loop restart.
// currentBeatsElapsed, detectedNote, isListening excluded (unused here).
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
