import { cn } from "assets/lib/utils";
import { Repeat, X } from "lucide-react";
import React, { memo, useCallback, useMemo, useRef, useState } from "react";

interface TablatureMinimapBarProps {
  measureEndXs: number[];
  totalBeats: number;
  currentBeat: number;
  loopStart: number | null;
  loopEnd: number | null;
  isPlaying: boolean;
  onSeek: (beat: number) => void;
  onLoopRangeChange: (start: number | null, end: number | null) => void;
  /** Note density (0–1) per measure — drawn as mini "waveform" bars */
  measureDensities?: number[];
  /** First visible beat on the main canvas (in beat-space) */
  viewportStart?: number;
  /** Last visible beat on the main canvas (in beat-space) */
  viewportEnd?: number;
}

interface BeatRange {
  start: number;
  end: number;
}

type DragMode = "none" | "pending" | "creating" | "resize-start" | "resize-end";

/** Pointer distance (px) within which a press grabs a loop-resize handle. */
const HANDLE_HIT_PX = 12;
/** Movement below this stays a click (seek); beyond it starts a loop drag. */
const DRAG_START_PX = 5;

const ACCENT = "#22d3ee";

export const TablatureMinimapBar = memo(function TablatureMinimapBar({
  measureEndXs,
  totalBeats,
  currentBeat,
  loopStart,
  loopEnd,
  isPlaying,
  onSeek,
  onLoopRangeChange,
  measureDensities,
  viewportStart,
  viewportEnd,
}: TablatureMinimapBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredMeasure, setHoveredMeasure] = useState<number | null>(null);
  const [isNearHandle, setIsNearHandle] = useState(false);
  const [draftRange, setDraftRange] = useState<BeatRange | null>(null);

  const dragModeRef  = useRef<DragMode>("none");
  const downXRef     = useRef(0);
  const downBeatRef  = useRef(0);
  const draftRef     = useRef<BeatRange | null>(null);

  const measures = useMemo(() => {
    if (totalBeats <= 0 || measureEndXs.length === 0) return [];
    const result: { startBeat: number; endBeat: number }[] = [];
    let prev = 0;
    for (const end of measureEndXs) {
      result.push({ startBeat: prev, endBeat: end });
      prev = end;
    }
    if (prev < totalBeats) result.push({ startBeat: prev, endBeat: totalBeats });
    return result;
  }, [measureEndXs, totalBeats]);

  const clientXToBeat = useCallback((clientX: number): number => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return Math.max(0, Math.min(totalBeats, ((clientX - rect.left) / rect.width) * totalBeats));
  }, [totalBeats]);

  const snapToMeasureStart = useCallback((beat: number): number => {
    for (const m of measures) {
      if (beat < m.endBeat) return m.startBeat;
    }
    return measures.length > 0 ? measures[measures.length - 1].startBeat : 0;
  }, [measures]);

  const snapToMeasureEnd = useCallback((beat: number): number => {
    for (const m of measures) {
      if (beat <= m.endBeat + 0.001) return m.endBeat;
    }
    return totalBeats;
  }, [measures, totalBeats]);

  const getMeasureIdx = useCallback((beat: number): number => {
    for (let i = 0; i < measures.length; i++) {
      if (beat < measures[i].endBeat) return i;
    }
    return measures.length - 1;
  }, [measures]);

  /** Which loop handle (if any) a given pointer position would grab. */
  const handleAtX = useCallback((clientX: number): "start" | "end" | null => {
    if (loopStart === null || loopEnd === null) return null;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const sx = rect.left + (loopStart / totalBeats) * rect.width;
    const ex = rect.left + (loopEnd   / totalBeats) * rect.width;
    const ds = Math.abs(clientX - sx);
    const de = Math.abs(clientX - ex);
    if (ds <= de && ds < HANDLE_HIT_PX) return "start";
    if (de < HANDLE_HIT_PX) return "end";
    return null;
  }, [loopStart, loopEnd, totalBeats]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setHoveredMeasure(null);
    downXRef.current    = e.clientX;
    downBeatRef.current = clientXToBeat(e.clientX);
    const handle = handleAtX(e.clientX);
    dragModeRef.current = handle === "start" ? "resize-start" : handle === "end" ? "resize-end" : "pending";
  }, [clientXToBeat, handleAtX]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const mode = dragModeRef.current;
    if (mode === "none") {
      setHoveredMeasure(getMeasureIdx(clientXToBeat(e.clientX)));
      setIsNearHandle(handleAtX(e.clientX) !== null);
      return;
    }

    const beat = clientXToBeat(e.clientX);
    if (mode === "pending") {
      if (Math.abs(e.clientX - downXRef.current) < DRAG_START_PX) return;
      dragModeRef.current = "creating";
    }

    let lo: number;
    let hi: number;
    if (dragModeRef.current === "creating") {
      lo = Math.min(downBeatRef.current, beat);
      hi = Math.max(downBeatRef.current, beat);
    } else if (dragModeRef.current === "resize-start" && loopEnd !== null) {
      lo = Math.min(beat, loopEnd);
      hi = Math.max(beat, loopEnd);
    } else if (dragModeRef.current === "resize-end" && loopStart !== null) {
      lo = Math.min(loopStart, beat);
      hi = Math.max(loopStart, beat);
    } else {
      return;
    }

    // Snap live so the draft shows exactly the loop that will be committed
    const dr = { start: snapToMeasureStart(lo), end: snapToMeasureEnd(hi) };
    draftRef.current = dr;
    setDraftRange(dr);
  }, [clientXToBeat, getMeasureIdx, handleAtX, loopStart, loopEnd, snapToMeasureStart, snapToMeasureEnd]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const mode = dragModeRef.current;
    if (mode === "none") return;
    dragModeRef.current = "none";
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const dr = draftRef.current;
    draftRef.current = null;
    setDraftRange(null);

    if (mode === "pending") {
      // A press that never moved past the threshold is a click — regardless of how long it was held
      onSeek(snapToMeasureStart(clientXToBeat(e.clientX)));
    } else if (dr && dr.end - dr.start > 0.001) {
      onLoopRangeChange(dr.start, dr.end);
    }
  }, [clientXToBeat, onLoopRangeChange, onSeek, snapToMeasureStart]);

  const handlePointerCancel = useCallback(() => {
    dragModeRef.current = "none";
    draftRef.current = null;
    setDraftRange(null);
  }, []);

  const currentMeasureIdx = useMemo(() => getMeasureIdx(currentBeat), [currentBeat, getMeasureIdx]);

  const hasLoop = loopStart !== null && loopEnd !== null;
  const displayRange = draftRange ?? (hasLoop ? { start: loopStart!, end: loopEnd! } : null);
  const displayMeasureRange = displayRange
    ? { from: getMeasureIdx(displayRange.start) + 1, to: getMeasureIdx(displayRange.end - 0.001) + 1 }
    : null;

  const bp = (beat: number) => `${(beat / totalBeats) * 100}%`;

  if (measures.length === 0) return null;

  const playedPct = Math.min(currentBeat / totalBeats, 1) * 100;
  const showPlayhead = isPlaying || currentBeat > 0;

  const vpStart = Math.max(0, viewportStart ?? 0);
  const vpEnd   = Math.min(totalBeats, viewportEnd ?? 0);
  const showViewport =
    viewportStart !== undefined && viewportEnd !== undefined &&
    vpEnd - vpStart > 0.01 && vpEnd - vpStart < totalBeats * 0.98;

  const hasDensities = !!measureDensities && measureDensities.length === measures.length;
  const labelEvery = measures.length > 48 ? 8 : 4;

  return (
    <div className="relative w-full select-none mb-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-1.5 px-0.5 min-h-[18px]">
        <div className="flex items-center gap-2.5">
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Navigator
          </span>

          {showPlayhead && (
            <span className="text-[10px] font-medium text-zinc-400 tabular-nums">
              Bar <span className="text-zinc-100 font-semibold">{currentMeasureIdx + 1}</span>
              <span className="text-zinc-600">/{measures.length}</span>
            </span>
          )}

          {displayMeasureRange && (
            <span className="flex items-center gap-1 rounded bg-cyan-500/10 px-1.5 py-px text-[10px] font-medium text-cyan-300 tabular-nums">
              <Repeat className="h-2.5 w-2.5" />
              Bars {displayMeasureRange.from}–{displayMeasureRange.to}
            </span>
          )}
        </div>

        {hasLoop && (
          <button
            onClick={() => onLoopRangeChange(null, null)}
            title="Remove the loop"
            className="flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-200"
          >
            <X className="h-2.5 w-2.5" />
            <span>Clear loop</span>
          </button>
        )}
      </div>

      {/* ── Tooltip + bar wrapper (tooltip must be outside overflow-hidden) */}
      <div className="relative">

        {/* ── Hover tooltip ────────────────────────────────────────────── */}
        {hoveredMeasure !== null && (
          <div
            className="absolute bottom-full mb-1 pointer-events-none z-30"
            style={{
              left: bp(
                measures[hoveredMeasure].startBeat +
                (measures[hoveredMeasure].endBeat - measures[hoveredMeasure].startBeat) / 2,
              ),
              transform: "translateX(-50%)",
            }}
          >
            <div className="px-2 py-0.5 rounded text-[10px] font-semibold text-white whitespace-nowrap"
              style={{ background: "#1e1e24", boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 2px 6px rgba(0,0,0,0.5)" }}
            >
              Bar {hoveredMeasure + 1}
            </div>
          </div>
        )}

        {/* ── Main bar ───────────────────────────────────────────────── */}
        <div
          ref={containerRef}
          className={cn(
            "relative h-9 rounded-md overflow-hidden",
            isNearHandle ? "cursor-ew-resize" : "cursor-pointer",
          )}
          style={{
            background: "#121217",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.12)",
            touchAction: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={() => { setHoveredMeasure(null); setIsNearHandle(false); }}
        >

          {/* ── Measure cells: hover highlight, gridlines, density bars ── */}
          {measures.map((m, i) => {
            const density = hasDensities ? measureDensities![i] : 0;
            const isHovered = hoveredMeasure === i;
            return (
              <div
                key={i}
                className="absolute inset-y-0 flex items-end transition-colors duration-75"
                style={{
                  left:        bp(m.startBeat),
                  width:       bp(m.endBeat - m.startBeat),
                  background:  isHovered ? "rgba(255,255,255,0.10)" : "transparent",
                  borderRight: (i + 1) % 4 === 0
                    ? "1px solid rgba(255,255,255,0.14)"
                    : "1px solid rgba(255,255,255,0.05)",
                }}
              >
                {density > 0 && (
                  <div
                    className="w-full rounded-t-[2px]"
                    style={{
                      height: `${12 + density * 58}%`,
                      margin: "0 1.5px",
                      background: "rgba(125,211,252,0.22)",
                    }}
                  />
                )}
              </div>
            );
          })}

          {/* ── Played-area progress fill ─────────────────────────────── */}
          {currentBeat > 0 && (
            <div
              className="absolute inset-y-0 left-0 z-[2] pointer-events-none"
              style={{
                width: `${playedPct}%`,
                background: "linear-gradient(90deg, rgba(34,211,238,0.05), rgba(34,211,238,0.16))",
                borderRight: "1px solid rgba(34,211,238,0.35)",
              }}
            />
          )}

          {/* ── Bar number labels ─────────────────────────────────────── */}
          {measures.map((m, i) =>
            i % labelEvery === 0 ? (
              <span
                key={`n${i}`}
                className="absolute top-1/2 -translate-y-1/2 text-[9px] font-medium text-zinc-400 pointer-events-none tabular-nums z-10"
                style={{ left: bp(m.startBeat), paddingLeft: "4px", textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}
              >
                {i + 1}
              </span>
            ) : null,
          )}

          {/* ── Viewport window: the part of the tab visible on the canvas */}
          {showViewport && (
            <div
              className="absolute inset-y-0 z-[8] rounded-[4px] pointer-events-none"
              style={{
                left:  bp(vpStart),
                width: bp(vpEnd - vpStart),
                border: "1px solid rgba(255,255,255,0.35)",
                background: "rgba(255,255,255,0.05)",
              }}
            />
          )}

          {/* ── Loop region ───────────────────────────────────────────── */}
          {displayRange && (
            <>
              <div className="absolute inset-y-0 z-[9] bg-black/50 pointer-events-none"
                style={{ left: 0, width: bp(displayRange.start) }} />
              <div className="absolute inset-y-0 z-[9] bg-black/50 pointer-events-none"
                style={{ left: bp(displayRange.end), right: 0 }} />
              <div className="absolute inset-y-0 z-[9] pointer-events-none"
                style={{
                  left:  bp(displayRange.start),
                  width: bp(displayRange.end - displayRange.start),
                  background: "rgba(34,211,238,0.10)",
                  borderTop:    `2px solid ${ACCENT}`,
                  borderBottom: `2px solid ${ACCENT}`,
                }} />
              {/* Resize handles (visual only — hit detection is proximity-based) */}
              {[displayRange.start, displayRange.end].map((b, hi) => (
                <div
                  key={hi}
                  className="absolute inset-y-0 z-20 w-2 -translate-x-1/2 pointer-events-none"
                  style={{ left: bp(b) }}
                >
                  <div
                    className="absolute inset-x-0 inset-y-[3px] rounded-[3px]"
                    style={{ background: ACCENT, boxShadow: "0 0 6px rgba(34,211,238,0.5)" }}
                  >
                    <div className="absolute left-1/2 top-1/2 h-3.5 w-px -translate-x-1/2 -translate-y-1/2 bg-cyan-950/70" />
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ── Playhead ──────────────────────────────────────────────── */}
          {showPlayhead && (
            <div
              className="absolute inset-y-0 z-30 w-[2px] -translate-x-1/2 pointer-events-none"
              style={{
                left: `${playedPct}%`,
                background: ACCENT,
                boxShadow: "0 0 8px 1px rgba(34,211,238,0.6)",
              }}
            />
          )}
        </div>
      </div>

      {/* ── Hints below bar ───────────────────────────────────────────── */}
      {!displayRange && (
        <p className="mt-1 px-0.5 text-[9px] text-zinc-600 pointer-events-none">
          <span className="text-zinc-400 font-medium">Click</span> to jump
          <span className="text-zinc-700"> · </span>
          <span className="text-zinc-400 font-medium">Drag</span> to loop a section
        </p>
      )}
    </div>
  );
});
