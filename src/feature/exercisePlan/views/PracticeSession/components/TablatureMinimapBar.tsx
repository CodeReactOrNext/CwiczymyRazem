import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

interface TablatureMinimapBarProps {
  measureEndXs: number[];
  totalBeats: number;
  currentBeat: number;
  loopStart: number | null;
  loopEnd: number | null;
  isPlaying: boolean;
  /** Pitch-detect accuracy per measure (0..1), same index as measureEndXs.
   *  null/undefined = not attempted yet this pass — cell stays unfilled. */
  measureAccuracy?: (number | null)[];
  onSeek: (beat: number) => void;
  onLoopRangeChange: (start: number | null, end: number | null) => void;
}

// ── Cell geometry (px) ────────────────────────────────────────────────
const CELL = 44;                 // measure-cell width
const CELL_H = 48;               // measure-cell height
const GAP = 8;                   // space between cells
const PAD = 10;                  // leading / trailing padding inside the strip
const TOP = 14;                  // room above the cells for the playhead triangle
const BOT = 4;                   // room below the cells so the loop outline isn't clipped
const UNIT = CELL + GAP;         // horizontal stride per measure
const CONTENT_H = TOP + CELL_H + BOT;

// Movement (px) below which a press stays a click (seek); beyond it a mouse press starts a loop drag.
const DRAG_START_PX = 6;

const ACCENT = "#22d3ee";

// Same breakpoints as the S/A/B/C/D performance grade elsewhere in the session,
// so a filled cell reads the same "how good was that" colour everywhere.
const accuracyFillColor = (acc: number): string => {
  if (acc >= 0.95) return "rgba(251,191,36,0.55)"; // amber-400 — S
  if (acc >= 0.85) return "rgba(52,211,153,0.5)"; // emerald-400 — A
  if (acc >= 0.7) return "rgba(34,211,238,0.5)"; // cyan-400 — B
  if (acc >= 0.5) return "rgba(251,146,60,0.5)"; // orange-400 — C
  return "rgba(248,113,113,0.55)"; // red-400 — D
};

type DragMode = "none" | "pending" | "creating";

interface Measure { startBeat: number; endBeat: number; }
interface MeasureRange { lo: number; hi: number; }

/**
 * Song navigator: one numbered cell per measure, laid out in a horizontally
 * scrollable strip. Click a bar to jump there; drag across bars (mouse) to set a
 * loop. Loop state is owned by the parent and drives playback restart, so the
 * loop selected here actually loops during practice.
 */
export const TablatureMinimapBar = memo(function TablatureMinimapBar({
  measureEndXs,
  totalBeats,
  currentBeat,
  loopStart,
  loopEnd,
  isPlaying,
  measureAccuracy,
  onSeek,
  onLoopRangeChange,
}: TablatureMinimapBarProps) {
  const scrollRef  = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [draft, setDraft] = useState<MeasureRange | null>(null);

  const dragModeRef   = useRef<DragMode>("none");
  const downXRef      = useRef(0);
  const downIdxRef    = useRef(0);
  const draftRef      = useRef<MeasureRange | null>(null);
  const isDraggingRef = useRef(false);

  const measures = useMemo<Measure[]>(() => {
    if (totalBeats <= 0 || measureEndXs.length === 0) return [];
    const result: Measure[] = [];
    let prev = 0;
    for (const end of measureEndXs) {
      result.push({ startBeat: prev, endBeat: end });
      prev = end;
    }
    if (prev < totalBeats) result.push({ startBeat: prev, endBeat: totalBeats });
    return result;
  }, [measureEndXs, totalBeats]);

  const count = measures.length;
  const contentWidth = PAD * 2 + count * CELL + Math.max(0, count - 1) * GAP;

  const getMeasureIdx = useCallback((beat: number): number => {
    for (let i = 0; i < measures.length; i++) {
      if (beat < measures[i].endBeat) return i;
    }
    return measures.length - 1;
  }, [measures]);

  // Screen X → measure index. The content element scrolls, so its rect already
  // accounts for the current scroll offset — no manual scrollLeft math needed.
  const clientXToIdx = useCallback((clientX: number): number => {
    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const x = clientX - rect.left - PAD;
    return Math.max(0, Math.min(count - 1, Math.floor(x / UNIT)));
  }, [count]);

  // ── Pointer: click = seek, drag = loop ──────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    downXRef.current   = e.clientX;
    downIdxRef.current = clientXToIdx(e.clientX);
    dragModeRef.current = "pending";
  }, [clientXToIdx]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const mode = dragModeRef.current;
    if (mode === "none") return;

    if (mode === "pending") {
      // Touch keeps native horizontal scrolling — only a mouse press becomes a loop drag.
      if (e.pointerType !== "mouse") return;
      if (Math.abs(e.clientX - downXRef.current) < DRAG_START_PX) return;
      dragModeRef.current = "creating";
      isDraggingRef.current = true;
      contentRef.current?.setPointerCapture(e.pointerId);
    }

    const idx = clientXToIdx(e.clientX);
    const dr: MeasureRange = {
      lo: Math.min(downIdxRef.current, idx),
      hi: Math.max(downIdxRef.current, idx),
    };
    draftRef.current = dr;
    setDraft(dr);
  }, [clientXToIdx]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const mode = dragModeRef.current;
    dragModeRef.current = "none";
    isDraggingRef.current = false;
    if (contentRef.current?.hasPointerCapture(e.pointerId)) {
      contentRef.current.releasePointerCapture(e.pointerId);
    }
    const dr = draftRef.current;
    draftRef.current = null;
    setDraft(null);

    if (mode === "pending") {
      // A touch pan that moved past the threshold is a scroll, not a tap — don't seek.
      if (Math.abs(e.clientX - downXRef.current) >= DRAG_START_PX) return;
      onSeek(measures[clientXToIdx(e.clientX)]?.startBeat ?? 0);
    } else if (mode === "creating" && dr) {
      onLoopRangeChange(measures[dr.lo].startBeat, measures[dr.hi].endBeat);
    }
  }, [clientXToIdx, measures, onSeek, onLoopRangeChange]);

  const handlePointerCancel = useCallback(() => {
    dragModeRef.current = "none";
    isDraggingRef.current = false;
    draftRef.current = null;
    setDraft(null);
  }, []);

  // Vertical wheel → horizontal scroll so pointer users can browse a long score.
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // trackpad already scrolling sideways
    el.scrollLeft += e.deltaY;
  }, []);

  const activeIdx = useMemo(() => getMeasureIdx(currentBeat), [currentBeat, getMeasureIdx]);

  // Follow the playhead: re-centre only once the active cell drifts near the edge,
  // so the strip stays put while the user manually scrolls to look ahead.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isDraggingRef.current || count === 0) return;
    const cellLeft = PAD + activeIdx * UNIT;
    const margin = CELL * 2;
    if (cellLeft < el.scrollLeft + margin || cellLeft + CELL > el.scrollLeft + el.clientWidth - margin) {
      el.scrollTo({ left: Math.max(0, cellLeft + CELL / 2 - el.clientWidth / 2), behavior: "smooth" });
    }
  }, [activeIdx, count]);

  // Cells re-render when accuracy changes (mic mode), not just when the
  // measure layout does.
  const cells = useMemo(
    () =>
      measures.map((_, i) => {
        const acc = measureAccuracy?.[i];
        return (
          <div
            key={i}
            className="absolute overflow-hidden rounded bg-zinc-800/70 transition-colors hover:bg-zinc-700/80"
            style={{ left: PAD + i * UNIT, top: TOP, width: CELL, height: CELL_H }}
          >
            {acc != null && (
              <div
                className="absolute inset-x-0 bottom-0 transition-[height] duration-300 ease-out"
                style={{ height: `${Math.round(acc * 100)}%`, background: accuracyFillColor(acc) }}
              />
            )}
            <div className="relative flex h-full items-center justify-center text-sm font-semibold tabular-nums text-zinc-300">
              {i + 1}
            </div>
          </div>
        );
      }),
    [measures, measureAccuracy],
  );

  if (count === 0) return null;

  const hasLoop = loopStart !== null && loopEnd !== null;
  const displayRange: MeasureRange | null =
    draft ??
    (hasLoop ? { lo: getMeasureIdx(loopStart!), hi: getMeasureIdx(loopEnd! - 0.001) } : null);

  const showPlayhead = isPlaying || currentBeat > 0;

  // Playhead sweeps across the active cell as the beat advances through the measure.
  const m = measures[activeIdx];
  const frac = m ? Math.max(0, Math.min(1, (currentBeat - m.startBeat) / (m.endBeat - m.startBeat))) : 0;
  const playheadX = PAD + activeIdx * UNIT + frac * CELL;

  return (
    <div className="mb-6 w-full select-none">

      {/* ── Scrollable strip of numbered measure cells ─────────────────── */}
      <div ref={scrollRef} onWheel={handleWheel} className="no-scrollbar overflow-x-auto">
        <div
          ref={contentRef}
          className="relative cursor-pointer"
          // The on-screen hint used to sit below the strip, but it appeared and
          // disappeared with the loop and shifted everything under it.
          title="Click a bar to jump · drag across bars to loop"
          style={{ width: contentWidth, height: CONTENT_H, touchAction: "pan-x" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          {cells}

          {/* ── Loop region outline ─────────────────────────────────────── */}
          {displayRange && (
            <div
              className="pointer-events-none absolute z-10 rounded"
              style={{
                left:   PAD + displayRange.lo * UNIT - 2,
                top:    TOP - 2,
                width:  (displayRange.hi - displayRange.lo) * UNIT + CELL + 4,
                height: CELL_H + 4,
                background: "rgba(34,211,238,0.12)",
                boxShadow: `inset 0 0 0 2px ${ACCENT}`,
              }}
            />
          )}

          {/* ── Active cell highlight ───────────────────────────────────── */}
          {showPlayhead && (
            <div
              className="pointer-events-none absolute z-10 rounded"
              style={{
                left:   PAD + activeIdx * UNIT,
                top:    TOP,
                width:  CELL,
                height: CELL_H,
                background: "rgba(34,211,238,0.18)",
                boxShadow: "inset 0 0 0 1.5px rgba(34,211,238,0.85)",
              }}
            />
          )}

          {/* ── Playhead (triangle + line) ──────────────────────────────── */}
          {showPlayhead && (
            <>
              <div
                className="pointer-events-none absolute z-20"
                style={{
                  left: playheadX,
                  top: 2,
                  transform: "translateX(-50%)",
                  width: 0,
                  height: 0,
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: `7px solid ${ACCENT}`,
                  filter: "drop-shadow(0 0 3px rgba(34,211,238,0.7))",
                }}
              />
              <div
                className="pointer-events-none absolute z-20"
                style={{
                  left: playheadX,
                  top: TOP - 4,
                  height: CELL_H + 8,
                  width: 2,
                  transform: "translateX(-50%)",
                  background: ACCENT,
                  boxShadow: "0 0 8px 1px rgba(34,211,238,0.6)",
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
});
