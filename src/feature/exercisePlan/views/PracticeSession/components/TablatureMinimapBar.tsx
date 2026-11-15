import { PRESSABLE } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { TabSection } from "../utils/tabSections";
import { sectionBarRange, sectionIndexOfBar } from "../utils/tabSections";

interface TablatureMinimapBarProps {
  measureEndXs: number[];
  totalBeats: number;
  /**
   * Live playhead position in beats.
   *
   * A ref rather than a value: the beat changes on every animation frame, and
   * pushing that through React re-rendered this strip — and everything else the
   * section holds — sixty times a second so a playhead could move a few pixels.
   * The position is read once per frame and written straight to the DOM instead.
   */
  currentBeatRef: React.MutableRefObject<number>;
  /**
   * Bumped by the parent whenever the playhead moves *outside* of playback: a
   * seek, a reset, a pause. Those are the moments a parked strip has to repaint
   * with no loop running, and there are only a handful of them per session.
   */
  beatVersion: number;
  loopStart: number | null;
  loopEnd: number | null;
  isPlaying: boolean;
  /** Something opaque is covering the session (the alignment screen), so a
   *  per-frame paint is work nobody can see. */
  paused?: boolean;
  /** Pitch-detect accuracy per measure (0..1), same index as measureEndXs.
   *  null/undefined = not attempted yet this pass — cell stays unfilled. */
  measureAccuracy?: (number | null)[];
  /**
   * The song's named sections (a Guitar Pro file's markers). With them the strip
   * shows bars only for the section the playhead is in; every other section is
   * folded into one block that jumps to it. Absent or a single one: every bar.
   */
  sections?: TabSection[];
  /** The beats of the section now opened into bars, null when there are none. */
  onOpenSectionChange?: (range: { startBeat: number; endBeat: number } | null) => void;
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

/** A section whose name says it is a solo gets a dot: it is what players jump to most. */
const isSolo = (name: string | undefined): boolean => !!name && /solo/i.test(name);

/** Name and bar range of a section, the same on a folded block and over the open one. */
function SectionLabel({ section }: { section: TabSection }) {
  return (
    <>
      {isSolo(section.name) && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-amber-400" />}
      {section.name && <span className="max-w-[180px] truncate" title={section.name}>{section.name}</span>}
      <span className="font-medium tabular-nums text-zinc-400">{sectionBarRange(section)}</span>
    </>
  );
}

type DragMode = "none" | "pending" | "creating";

interface Measure { startBeat: number; endBeat: number; }
interface MeasureRange { lo: number; hi: number; }

/**
 * Song navigator: one numbered cell per measure, laid out in a horizontally
 * scrollable strip. Click a bar to jump there; drag across bars (mouse) to set a
 * loop. Loop state is owned by the parent and drives playback restart, so the
 * loop selected here actually loops during practice.
 *
 * A song with named sections folds: only the section the playhead is in is laid
 * out as bars, the others are one block each. Everything about the bars below
 * (pointer maths, playhead, loop outline) then works on that section's bars —
 * the "window" — and a song without sections is simply one window of all of them.
 *
 * The playhead is the one thing here that moves continuously, so it is the one
 * thing that is not React state: it is positioned by writing a transform inside
 * an animation frame. Everything else — cells, loop outline — only changes when
 * the player does something, and stays ordinary state.
 */
export const TablatureMinimapBar = memo(function TablatureMinimapBar({
  measureEndXs,
  totalBeats,
  currentBeatRef,
  beatVersion,
  loopStart,
  loopEnd,
  isPlaying,
  paused = false,
  measureAccuracy,
  sections,
  onOpenSectionChange,
  onSeek,
  onLoopRangeChange,
}: TablatureMinimapBarProps) {
  const { t } = useTranslation("session");
  const scrollRef  = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Positioned every frame while playing, and never read back by React.
  const activeCellRef   = useRef<HTMLDivElement>(null);
  const playheadTipRef  = useRef<HTMLDivElement>(null);
  const playheadLineRef = useRef<HTMLDivElement>(null);
  /** Last bar the playhead was in, so the strip only re-centres on a change. */
  const lastIdxRef = useRef(-1);
  /** Where the playhead was last put, in CSS px — NaN before the first write. */
  const lastPlayheadXRef = useRef(Number.NaN);

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

  const getMeasureIdx = useCallback((beat: number): number => {
    for (let i = 0; i < measures.length; i++) {
      if (beat < measures[i].endBeat) return i;
    }
    return measures.length - 1;
  }, [measures]);

  // Folding only helps when there is something to fold away.
  const sectionList = sections && sections.length > 1 && count > 0 ? sections : null;

  /**
   * The section the moving playhead is in. Set from the animation loop, and only
   * when it crosses into another section — a handful of times a song. It is
   * stamped with the resting beat it was seen under: any seek, pause or reset
   * moves that beat, and the stale section is ignored from then on.
   */
  const [liveSection, setLiveSection] = useState<{ idx: number; version: number } | null>(null);
  const restingSection = sectionList ? sectionIndexOfBar(sectionList, getMeasureIdx(beatVersion)) : -1;
  const openIdx = !sectionList
    ? -1
    : isPlaying && liveSection && liveSection.version === beatVersion && liveSection.idx < sectionList.length
      ? liveSection.idx
      : restingSection;

  // The bars laid out as cells: the open section's, or all of them.
  const winLo = sectionList ? Math.min(sectionList[openIdx].lo, count - 1) : 0;
  const winHi = sectionList ? Math.min(sectionList[openIdx].hi, count - 1) : count - 1;
  const winCount = Math.max(0, winHi - winLo + 1);
  const contentWidth = PAD * 2 + winCount * CELL + Math.max(0, winCount - 1) * GAP;

  const openStartBeat = sectionList ? measures[winLo]?.startBeat ?? null : null;
  const openEndBeat = sectionList ? measures[winHi]?.endBeat ?? null : null;
  useEffect(() => {
    onOpenSectionChange?.(
      openStartBeat !== null && openEndBeat !== null ? { startBeat: openStartBeat, endBeat: openEndBeat } : null,
    );
  }, [onOpenSectionChange, openStartBeat, openEndBeat]);

  // Screen X → measure index. The content element scrolls, so its rect already
  // accounts for the current scroll offset — no manual scrollLeft math needed.
  const clientXToIdx = useCallback((clientX: number): number => {
    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const x = clientX - rect.left - PAD;
    return winLo + Math.max(0, Math.min(winCount - 1, Math.floor(x / UNIT)));
  }, [winLo, winCount]);

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

  /**
   * Puts the playhead and the active-cell highlight where the beat ref says
   * they belong. The only thing on this strip that runs per frame.
   */
  const paint = useCallback(() => {
    const tip  = playheadTipRef.current;
    const line = playheadLineRef.current;
    const cell = activeCellRef.current;
    if (!tip || !line || !cell || count === 0) return;

    const beat = currentBeatRef.current;
    const show = isPlaying || beat > 0;
    const display = show ? "block" : "none";
    if (tip.style.display !== display) {
      tip.style.display  = display;
      line.style.display = display;
      cell.style.display = display;
    }
    if (!show) {
      lastIdxRef.current = -1;
      lastPlayheadXRef.current = Number.NaN;
      return;
    }

    const idx = getMeasureIdx(beat);
    // The playhead has just left the open section: the strip is about to be laid
    // out again around the new one, and there is no cell here to put it on.
    const visibility = idx < winLo || idx > winHi ? "hidden" : "visible";
    if (cell.style.visibility !== visibility) {
      tip.style.visibility  = visibility;
      line.style.visibility = visibility;
      cell.style.visibility = visibility;
    }
    if (visibility === "hidden") return;
    const local = idx - winLo;
    const m = measures[idx];
    // Playhead sweeps across the active cell as the beat advances through the measure.
    const frac = m
      ? Math.max(0, Math.min(1, (beat - m.startBeat) / (m.endBeat - m.startBeat)))
      : 0;
    // On the screen's pixel grid: the playhead crosses a cell over a whole bar,
    // far less than a pixel a frame, and a write that moves it nowhere still
    // costs the page a style pass and a repaint — 165 of them a second.
    const pixel = 1 / (window.devicePixelRatio || 1);
    const playheadX = Math.round((PAD + local * UNIT + frac * CELL) / pixel) * pixel;

    if (playheadX !== lastPlayheadXRef.current) {
      lastPlayheadXRef.current = playheadX;
      // A transform rather than `left`: the playhead then moves without dirtying
      // the strip's layout.
      tip.style.transform  = `translate3d(${playheadX}px, 0, 0) translateX(-50%)`;
      line.style.transform = `translate3d(${playheadX}px, 0, 0) translateX(-50%)`;
    }

    if (idx === lastIdxRef.current) return;
    lastIdxRef.current = idx;
    cell.style.transform = `translate3d(${local * UNIT}px, 0, 0)`;

    // Follow the playhead: re-centre only once the active cell drifts near the
    // edge, so the strip stays put while the user scrolls ahead to look around.
    const el = scrollRef.current;
    if (!el || isDraggingRef.current) return;
    // The bars sit after the folded blocks that precede them in the row.
    const cellLeft = (contentRef.current?.offsetLeft ?? 0) + PAD + local * UNIT;
    const margin = CELL * 2;
    if (cellLeft < el.scrollLeft + margin || cellLeft + CELL > el.scrollLeft + el.clientWidth - margin) {
      el.scrollTo({ left: Math.max(0, cellLeft + CELL / 2 - el.clientWidth / 2), behavior: "smooth" });
    }
  }, [count, currentBeatRef, getMeasureIdx, isPlaying, measures, winLo, winHi]);

  // While the beat is moving, follow it. Parked — paused, or covered by the
  // alignment screen — there is nothing to follow and no loop runs at all.
  useEffect(() => {
    if (!isPlaying || paused || count === 0) return undefined;
    let rafId = requestAnimationFrame(function tick() {
      if (sectionList) {
        const idx = sectionIndexOfBar(sectionList, getMeasureIdx(currentBeatRef.current));
        if (idx !== openIdx) setLiveSection({ idx, version: beatVersion });
      }
      paint();
      rafId = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, paused, count, paint, sectionList, openIdx, beatVersion, getMeasureIdx, currentBeatRef]);

  // Seeks, resets and pauses move the playhead with no loop running.
  useEffect(() => {
    lastIdxRef.current = -1;
    lastPlayheadXRef.current = Number.NaN;
    paint();
  }, [beatVersion, paint]);

  // Each cell's accuracy fill, written straight to the DOM like the playhead.
  // Accuracy changes with every hit, many times a second while playing, and a
  // song can be hundreds of bars long: rendering that many cells again each
  // time cost ~20 ms a hit on a 566-bar song — more than a frame.
  const fillRefs = useRef<(HTMLDivElement | null)[]>([]);
  /** What each fill shows now, so only the ones that changed are touched. */
  const shownRef = useRef<(number | null)[]>([]);

  // The cells themselves only change with the measure layout. Each is a key
  // with a lip: the face is opaque zinc-800, as the old zinc-800/70 over the
  // strip left no shade between face and page for a darker lip to show. The
  // accuracy fill is positioned inside the border, so it rises above the lip.
  const cells = useMemo(() => {
    shownRef.current = [];
    return measures.slice(winLo, winHi + 1).map((_, local) => {
      const i = winLo + local;
      return (
      <div
        key={i}
        className={`${PRESSABLE} absolute overflow-hidden rounded border-b-black/30 bg-zinc-800 transition-colors hover:bg-zinc-700`}
        style={{ left: PAD + local * UNIT, top: TOP, width: CELL, height: CELL_H }}
      >
        <div
          ref={(el) => { fillRefs.current[i] = el; }}
          className="absolute inset-x-0 bottom-0 transition-[height] duration-base ease-out"
          style={{ height: 0 }}
        />
        <div className="relative flex h-full items-center justify-center text-sm font-semibold tabular-nums text-zinc-300">
          {i + 1}
        </div>
      </div>
      );
    });
  }, [measures, winLo, winHi]);

  useEffect(() => {
    const shown = shownRef.current;
    for (let i = winLo; i <= winHi; i++) {
      const acc = measureAccuracy?.[i] ?? null;
      const fill = fillRefs.current[i];
      if (!fill || shown[i] === acc) continue;
      shown[i] = acc;
      fill.style.height = acc == null ? "0" : `${Math.round(acc * 100)}%`;
      fill.style.background = acc == null ? "" : accuracyFillColor(acc);
    }
  }, [cells, winLo, winHi, measureAccuracy]);

  if (count === 0) return null;

  const hasLoop = loopStart !== null && loopEnd !== null;
  const fullRange: MeasureRange | null =
    draft ??
    (hasLoop ? { lo: getMeasureIdx(loopStart!), hi: getMeasureIdx(loopEnd! - 0.001) } : null);
  // Only the part of the loop that falls on the bars laid out here can be drawn.
  const displayRange: MeasureRange | null =
    fullRange && fullRange.hi >= winLo && fullRange.lo <= winHi
      ? { lo: Math.max(fullRange.lo, winLo) - winLo, hi: Math.min(fullRange.hi, winHi) - winLo }
      : null;

  const strip = (
        <div
          ref={contentRef}
          className="relative cursor-pointer"
          // The on-screen hint used to sit below the strip, but it appeared and
          // disappeared with the loop and shifted everything under it.
          title={t("tab.minimap_hint")}
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
          {/* Mounted whether or not it shows: unmounting it with the playhead
              would put React back into the animation loop. `paint` owns both
              its position and whether it is displayed at all. */}
          <div
            ref={activeCellRef}
            className="pointer-events-none absolute z-10 rounded"
            style={{
              left:   PAD,
              top:    TOP,
              width:  CELL,
              height: CELL_H,
              display: "none",
              background: "rgba(34,211,238,0.18)",
              boxShadow: "inset 0 0 0 1.5px rgba(34,211,238,0.85)",
            }}
          />

          {/* ── Playhead (triangle + line) ──────────────────────────────── */}
          <div
            ref={playheadTipRef}
            className="pointer-events-none absolute z-20"
            style={{
              left: 0,
              top: 2,
              display: "none",
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: `7px solid ${ACCENT}`,
              filter: "drop-shadow(0 0 3px rgba(34,211,238,0.7))",
            }}
          />
          <div
            ref={playheadLineRef}
            className="pointer-events-none absolute z-20"
            style={{
              left: 0,
              top: TOP - 4,
              height: CELL_H + 8,
              width: 2,
              display: "none",
              background: ACCENT,
              boxShadow: "0 0 8px 1px rgba(34,211,238,0.6)",
            }}
          />
        </div>
  );

  return (
    <div className="mb-6 w-full select-none">

      {/* ── Scrollable strip: numbered measure cells, folded sections around them ── */}
      <div ref={scrollRef} onWheel={handleWheel} className="no-scrollbar overflow-x-auto">
        {/* Positioned, so the bars' offset inside the row can be read for scrolling. */}
        <div className="relative flex w-max items-end gap-2">
          {!sectionList
            ? strip
            : sectionList.map((section, i) =>
                i === openIdx ? (
                  <div key={i} className="flex flex-col gap-1 rounded-lg bg-zinc-800/40 pt-2">
                    <div
                      className="flex items-center gap-2 whitespace-nowrap text-xs font-semibold text-zinc-200"
                      style={{ paddingInline: PAD }}>
                      <SectionLabel section={section} />
                    </div>
                    {strip}
                  </div>
                ) : (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSeek(measures[Math.min(section.lo, count - 1)]?.startBeat ?? 0)}
                    className={cn(
                      PRESSABLE,
                      "flex shrink-0 items-center gap-2 whitespace-nowrap rounded border-b-black/30 bg-zinc-800 px-3 text-xs text-zinc-200 transition-colors hover:bg-zinc-700",
                    )}
                    style={{ height: CELL_H, marginBottom: BOT }}>
                    <SectionLabel section={section} />
                  </button>
                ),
              )}
        </div>
      </div>
    </div>
  );
});
