import { cn } from "assets/lib/utils";
import { X } from "lucide-react";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

interface TablatureMinimapBarProps {
  measureEndXs: number[];
  totalBeats: number;
  currentBeat: number;
  loopStart: number | null;
  loopEnd: number | null;
  isPlaying: boolean;
  onSeek: (beat: number) => void;
  onLoopRangeChange: (start: number | null, end: number | null) => void;
  /** unused — kept for API compat */
  measureDensities?: number[];
  /** First visible beat on the main canvas (in beat-space) */
  viewportStart?: number;
  /** Last visible beat on the main canvas (in beat-space) */
  viewportEnd?: number;
}

type DragMode = "none" | "creating" | "resize-start" | "resize-end";

// One solid colour per 8-measure section — on a black background these are clearly distinct
const SECTION_COLORS = [
  { fill: "#1a2744", fillAlt: "#142038", accent: "#3b82f6" }, // blue
  { fill: "#231a3a", fillAlt: "#1b142d", accent: "#a855f7" }, // purple
  { fill: "#0f2e28", fillAlt: "#0b2320", accent: "#14b8a6" }, // teal
  { fill: "#2e1a1a", fillAlt: "#231313", accent: "#ef4444" }, // red
  { fill: "#2a2400", fillAlt: "#201b00", accent: "#eab308" }, // yellow
];

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
  const [draftRangeDisplay, setDraftRangeDisplay] = useState<{ start: number; end: number } | null>(null);

  const dragModeRef     = useRef<DragMode>("none");
  const mouseDownXRef   = useRef(0);
  const mouseDownMsRef  = useRef(0);
  const mouseDownBeatRef = useRef(0);
  const draftRangeRef   = useRef<{ start: number; end: number } | null>(null);

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

  const currentMeasureIdx = useMemo(() => getMeasureIdx(currentBeat), [currentBeat, getMeasureIdx]);

  const loopStartMeasure = useMemo(
    () => (loopStart !== null ? getMeasureIdx(loopStart) : null),
    [loopStart, getMeasureIdx],
  );
  const loopEndMeasure = useMemo(
    () => (loopEnd !== null ? getMeasureIdx(loopEnd - 0.001) : null),
    [loopEnd, getMeasureIdx],
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const beat = clientXToBeat(e.clientX);
    mouseDownXRef.current     = e.clientX;
    mouseDownMsRef.current    = Date.now();
    mouseDownBeatRef.current  = beat;

    if (loopStart !== null && loopEnd !== null) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const lsx = rect.left + (loopStart / totalBeats) * rect.width;
        const lex = rect.left + (loopEnd   / totalBeats) * rect.width;
        if (Math.abs(e.clientX - lsx) < 12) { dragModeRef.current = "resize-start"; return; }
        if (Math.abs(e.clientX - lex) < 12) { dragModeRef.current = "resize-end";   return; }
      }
    }

    dragModeRef.current = "creating";
    const dr = { start: beat, end: beat };
    draftRangeRef.current = dr;
    setDraftRangeDisplay(dr);
  }, [clientXToBeat, loopStart, loopEnd, totalBeats]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragModeRef.current === "none") {
      setHoveredMeasure(getMeasureIdx(clientXToBeat(e.clientX)));
    }
  }, [clientXToBeat, getMeasureIdx]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const mode = dragModeRef.current;
      if (mode === "none") return;
      const beat = clientXToBeat(e.clientX);
      let dr: { start: number; end: number };

      if (mode === "creating") {
        const s = mouseDownBeatRef.current;
        dr = { start: Math.min(s, beat), end: Math.max(s, beat) };
      } else if (mode === "resize-start" && loopEnd !== null) {
        dr = { start: Math.min(beat, loopEnd), end: Math.max(beat, loopEnd) };
      } else if (mode === "resize-end" && loopStart !== null) {
        dr = { start: Math.min(loopStart, beat), end: Math.max(loopStart, beat) };
      } else {
        return;
      }
      draftRangeRef.current = dr;
      setDraftRangeDisplay({ ...dr });
    };

    const onUp = (e: MouseEvent) => {
      const mode = dragModeRef.current;
      if (mode === "none") return;
      const dx = Math.abs(e.clientX - mouseDownXRef.current);
      const dt = Date.now() - mouseDownMsRef.current;
      const dr = draftRangeRef.current;

      if (dx < 4 && dt < 300 && mode === "creating") {
        onSeek(snapToMeasureStart(clientXToBeat(e.clientX)));
      } else if (dr) {
        const start = snapToMeasureStart(dr.start);
        const end   = snapToMeasureEnd(dr.end);
        if (end - start >= 1) onLoopRangeChange(start, end);
      }

      draftRangeRef.current = null;
      setDraftRangeDisplay(null);
      dragModeRef.current = "none";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, [loopStart, loopEnd, clientXToBeat, snapToMeasureStart, snapToMeasureEnd, onSeek, onLoopRangeChange]);

  const displayRange = draftRangeDisplay ?? (
    loopStart !== null && loopEnd !== null ? { start: loopStart, end: loopEnd } : null
  );

  const bp = (beat: number) => `${(beat / totalBeats) * 100}%`;

  if (measures.length === 0) return null;

  const hasLoop    = displayRange !== null && !draftRangeDisplay;
  const playedPct  = Math.min(currentBeat / totalBeats, 1) * 100;
  const hasViewport = viewportStart !== undefined && viewportEnd !== undefined && totalBeats > 0;

  return (
    <div className="relative w-full select-none mb-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-1 px-0.5">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold tracking-[0.18em] text-zinc-500 uppercase">
            Navigator
          </span>

          {(isPlaying || currentBeat > 0) && (
            <span className="text-[10px] font-medium text-zinc-400 tabular-nums">
              Bar <span className="text-white font-semibold">{currentMeasureIdx + 1}</span>
              <span className="text-zinc-600"> / {measures.length}</span>
            </span>
          )}

          {hasLoop && loopStartMeasure !== null && loopEndMeasure !== null && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-cyan-400/90">
              <span className="text-[11px] leading-none">⟳</span>
              {loopStartMeasure + 1}–{loopEndMeasure + 1}
            </span>
          )}
        </div>

        {hasLoop && (
          <button
            onClick={() => onLoopRangeChange(null, null)}
            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="h-2.5 w-2.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* ── Tooltip + bar wrapper (tooltip must be outside overflow-hidden) */}
      <div className="relative">

        {/* ── Hover tooltip (#10) ──────────────────────────────────────── */}
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
          className="relative h-6 rounded-md overflow-hidden cursor-pointer"
          style={{
            background: "#0a0a0d",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.12)",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredMeasure(null)}
          onDoubleClick={() => onLoopRangeChange(null, null)}
        >

          {/* ── Measure cells — section colour grouping ──────────────── */}
          {measures.map((m, i) => {
            const section        = Math.floor(i / 8);
            const { fill, fillAlt, accent } = SECTION_COLORS[section % SECTION_COLORS.length];
            const isSectionStart = i > 0 && i % 8 === 0;
            const isHovered      = hoveredMeasure === i && dragModeRef.current === "none";

            return (
              <div
                key={i}
                className="absolute top-0 bottom-0 transition-colors duration-75"
                style={{
                  left:        bp(m.startBeat),
                  width:       bp(m.endBeat - m.startBeat),
                  background:  isHovered ? "rgba(255,255,255,0.14)" : i % 2 === 0 ? fill : fillAlt,
                  borderRight: "1px solid rgba(255,255,255,0.08)",
                  ...(isSectionStart ? { borderLeft: `3px solid ${accent}` } : {}),
                }}
              />
            );
          })}

          {/* ── Measure number labels ─────────────────────────────────── */}
          {measures.map((m, i) =>
            i === 0 || (i + 1) % 4 === 0 ? (
              <span
                key={`n${i}`}
                className="absolute top-[3px] text-[9px] font-semibold text-zinc-400 pointer-events-none tabular-nums z-10"
                style={{ left: bp(m.startBeat), paddingLeft: "3px" }}
              >
                {i + 1}
              </span>
            ) : null,
          )}

          {/* ── Played-area progress fill ─────────────────────────────── */}
          {currentBeat > 0 && (
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{
                left: 0,
                width: `${playedPct}%`,
                background: "linear-gradient(90deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)",
              }}
            />
          )}

          {/* ── Loop region ───────────────────────────────────────────── */}
          {displayRange && (
            <>
              <div className="absolute top-0 bottom-0 bg-black/40 pointer-events-none"
                style={{ left: 0, width: bp(displayRange.start) }} />
              <div className="absolute top-0 bottom-0 bg-black/40 pointer-events-none"
                style={{ left: bp(displayRange.end), right: 0 }} />
              <div className="absolute top-0 bottom-0 pointer-events-none"
                style={{ left: bp(displayRange.start), width: bp(displayRange.end - displayRange.start), background: "rgba(6,182,212,0.12)" }} />
              <div className="absolute top-0 h-[2px] pointer-events-none"
                style={{ left: bp(displayRange.start), width: bp(displayRange.end - displayRange.start), background: "rgba(6,182,212,0.75)" }} />
              <div className="absolute top-0 bottom-0 w-[3px] cursor-ew-resize z-10"
                style={{ left: bp(displayRange.start), background: "rgba(6,182,212,0.9)", boxShadow: "1px 0 6px rgba(6,182,212,0.4)" }} />
              <div className="absolute top-0 bottom-0 w-[3px] cursor-ew-resize z-10"
                style={{ right: `${100 - (displayRange.end / totalBeats) * 100}%`, background: "rgba(6,182,212,0.9)", boxShadow: "-1px 0 6px rgba(6,182,212,0.4)" }} />
            </>
          )}

          {/* ── Active measure highlight ──────────────────────────────── */}
          {(isPlaying || currentBeat > 0) && (
            <div
              className="absolute top-0 bottom-0 pointer-events-none z-[15]"
              style={{
                left:       bp(measures[currentMeasureIdx].startBeat),
                width:      bp(measures[currentMeasureIdx].endBeat - measures[currentMeasureIdx].startBeat),
                background: "rgba(255,255,255,0.15)",
                borderTop:  "2px solid rgba(255,255,255,0.6)",
              }}
            />
          )}

          {/* ── Playhead ──────────────────────────────────────────────── */}
          {(isPlaying || currentBeat > 0) && (
            <div
              className="absolute top-0 bottom-0 w-[2px] pointer-events-none z-20"
              style={{
                left: `${playedPct}%`,
                background: "#22d3ee",
                boxShadow: "0 0 8px 2px rgba(34,211,238,0.55), 0 0 2px rgba(34,211,238,1)",
              }}
            />
          )}
        </div>
      </div>

      {/* ── Hints below bar ───────────────────────────────────────────── */}
      {!hasLoop && !isPlaying && currentBeat === 0 && (
        <p className="mt-0.5 px-0.5 text-[9px] text-zinc-700 pointer-events-none">
          Click to jump · Drag to set loop
        </p>
      )}
    </div>
  );
});
