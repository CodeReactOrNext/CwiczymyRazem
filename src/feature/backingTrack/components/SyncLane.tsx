import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { useEffect, useRef } from "react";

import { useCanvasSize, useTimelineFrame } from "../hooks/useTimelineFrame";
import type { TimelineWindow } from "../types/backingTrack.types";
import { beatGridLines, DRAG_COMMIT_MS } from "../utils/alignment";
import { sessionBeats } from "../utils/backingSync";
import type { DragLimits } from "../utils/syncLaneDrag";
import { barLineNear, dragLimits, placeDraggedLine } from "../utils/syncLaneDrag";
import { bpmBetween } from "../utils/tempoMap";
import { TIMELINE_COLORS } from "../utils/timelineColors";

/** The strip along the top that carries the bar numbers. */
const RULER_PX = 24;

const BAR_LABEL_FONT = "700 12px ui-monospace, SFMono-Regular, Menlo, monospace";
const READOUT_FONT = "600 11px ui-monospace, SFMono-Regular, Menlo, monospace";

/** Below this much room between bars, number only every second or fourth one. */
const MIN_BAR_LABEL_GAP_PX = 34;

/** Shade over the recording before bar 1 — the part the tab does not cover. */
const INTRO_SHADE = "rgba(9, 9, 11, 0.45)";

interface SyncLaneProps extends TimelineWindow {
  /** What is heard, as one outline — see useRecordingAnalysis. */
  peaks: Float32Array | null;
  peaksPerSecond: number;
  /** Attack strength once the recording is analysed — what a dropped line
   *  snaps onto. Until then the outline stands in. */
  onset?: Float32Array | null;
  onsetFps?: number;
  heightPx: number;
  /** Bar 1 moved: where the tab starts in the recording. */
  onOffsetChange: (offsetMs: number, options?: { realign?: boolean }) => void;
  /** Any other bar moved — pinned to that moment — or unpinned with null. */
  onAnchorChange: (beat: number, sec: number | null, options?: { realign?: boolean }) => void;
  /**
   * A bar line was taken hold of.
   *
   * A following view is centred on the playhead, which sits on the tab's own
   * clock — so without parking it, dragging bar 1 slides the picture along with
   * the hand and the line looks pinned in place while it is in fact moving.
   */
  onEditStart?: () => void;
  /** Dragging anywhere that is not a bar line moves the view, like a map. */
  onPanStart: (clientX: number) => void;
  onPanMove: (clientX: number) => void;
  onPanEnd: () => void;
  className?: string;
}

/** Trims float noise while keeping the tenths that matter: 91.6 stays 91.6. */
const formatBpm = (bpm: number) => (Math.round(bpm * 10) / 10).toFixed(1);
const formatMs = (ms: number) => `${ms > 0 ? "+" : ""}${Math.round(ms)} ms`;

/**
 * The recording and the tab's bar lines in one picture — the whole of syncing.
 *
 * Every bar line is a handle, and it follows the hand exactly: drop it on the
 * beat you can see in the waveform and it lands there (pulled onto the attack
 * nearest the drop; Alt drops it exactly). Bar 1 says where the tab starts in
 * the recording; any later bar pins the tempo up to it, which is how a band
 * that speeds up or drags gets a grid that follows it. Double-click a pinned
 * bar to let it go.
 *
 * Everything else is the view: drag empty space to move along the recording,
 * scroll to zoom. One meaning per gesture, so there is no mode to be in.
 *
 * Painted on a canvas from the shared frame loop — the lane repaints while
 * playing and must never re-render the practice session to do it.
 */
export function SyncLane({
  peaks,
  peaksPerSecond,
  onset = null,
  onsetFps = 0,
  heightPx,
  startTime,
  effectiveBpm,
  scoreClockRef,
  getResumeBeat,
  sourceBpm,
  offsetMs,
  tempoMap,
  beatsPerBar,
  windowSec,
  centreSecOverride,
  onOffsetChange,
  onAnchorChange,
  onEditStart,
  onPanStart,
  onPanMove,
  onPanEnd,
  className,
}: SyncLaneProps) {
  const { t } = useTranslation("backing_track");
  const words = {
    bar1: t("lane.bar1"),
    onBeat: t("lane.on_beat"),
    bar: (n: number) => t("lane.bar_n", { n }),
  };
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizeRef = useCanvasSize(canvasRef, heightPx);

  const paramsRef = useRef({
    peaks, peaksPerSecond, onset, onsetFps, heightPx, startTime, effectiveBpm, scoreClockRef,
    getResumeBeat, sourceBpm, offsetMs, tempoMap, beatsPerBar, windowSec, centreSecOverride, words,
  });
  useEffect(() => {
    paramsRef.current = {
      peaks, peaksPerSecond, onset, onsetFps, heightPx, startTime, effectiveBpm, scoreClockRef,
      getResumeBeat, sourceBpm, offsetMs, tempoMap, beatsPerBar, windowSec, centreSecOverride, words,
    };
  });

  /** Window the last frame drew, so pointer maths matches what is on screen. */
  const viewRef = useRef({ startSec: 0, secondsPerPixel: 0.004 });
  /** The bar line in hand: where it started, where it is now, its limits. */
  const dragRef = useRef<{
    beat: number;
    originX: number;
    originSec: number;
    /** Neighbouring pins it may not cross, and the one it is measured from. */
    limits: DragLimits;
    moved: boolean;
    currentSec: number;
    snapped: boolean;
  } | null>(null);
  /** Whether the current gesture is a pan rather than a line. */
  const panningRef = useRef(false);
  /** Bar line under the pointer, so the one about to be grabbed lights up. */
  const hoverBeatRef = useRef<number | null>(null);
  const lastCommitAtRef = useRef(0);
  const lastFrameKeyRef = useRef("");
  const columnsRef = useRef<Float32Array | null>(null);
  const labelWidthRef = useRef(new Map<string, number>());

  useTimelineFrame(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = ctxRef.current ?? (ctxRef.current = canvas.getContext("2d"));
    if (!ctx) return;

    const p = paramsRef.current;
    const { width, devicePixelRatio: dpr } = sizeRef.current;
    const height = p.heightPx;
    if (width === 0) return;

    const beats = sessionBeats(
      Date.now(), p.startTime, p.effectiveBpm, p.scoreClockRef.current, p.getResumeBeat,
    );
    const playheadSec = p.tempoMap.secForBeat(beats);
    const centreSec = p.centreSecOverride ?? playheadSec;
    const windowStart = centreSec - p.windowSec / 2;
    const windowEnd = centreSec + p.windowSec / 2;
    const secondsPerPixel = p.windowSec / width;
    viewRef.current = { startSec: windowStart, secondsPerPixel };
    const xOf = (sec: number) => Math.round((sec - windowStart) / secondsPerPixel) + 0.5;

    const drag = dragRef.current;
    // Quantised to the pixel each value lands on, so a parked, idle lane stops
    // repainting the same picture sixty times a second.
    const frameKey = [
      width, height, p.windowSec, p.offsetMs, p.beatsPerBar,
      Math.round(windowStart / secondsPerPixel), Math.round(playheadSec / secondsPerPixel),
      p.peaks?.length ?? 0, p.tempoMap.points.map((point) => point.sec.toFixed(4)).join(","),
      hoverBeatRef.current ?? "",
      drag ? `${drag.beat}:${Math.round(drag.currentSec / secondsPerPixel)}:${drag.snapped}` : "",
    ].join("|");
    if (frameKey === lastFrameKeyRef.current) return;
    lastFrameKeyRef.current = frameKey;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const waveTop = RULER_PX;
    const waveH = height - RULER_PX;
    const midY = waveTop + waveH / 2;

    // The ruler strip: a shade darker, so the numbers sit on their own band.
    ctx.fillStyle = "rgba(9, 9, 11, 0.55)";
    ctx.fillRect(0, 0, width, RULER_PX);

    const lines = beatGridLines({
      windowStartSec: windowStart,
      windowEndSec: windowEnd,
      sourceBpm: p.sourceBpm,
      offsetMs: p.offsetMs,
      beatsPerBar: p.beatsPerBar,
      tempoMap: p.tempoMap,
      secondsPerPixel,
    });
    const pinned = new Set(p.tempoMap.points.map((point) => point.beat));

    // Plain beats under the waveform — texture, not something to read.
    ctx.strokeStyle = TIMELINE_COLORS.beatLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const line of lines) {
      if (line.isBarStart) continue;
      const x = xOf(line.sec);
      ctx.moveTo(x, waveTop);
      ctx.lineTo(x, height);
    }
    ctx.stroke();

    // ── Waveform ──────────────────────────────────────────────────────────
    if (p.peaks && p.peaks.length > 0) {
      const wave = p.peaks;
      const half = waveH / 2 - 6;
      const columns =
        columnsRef.current && columnsRef.current.length >= width
          ? columnsRef.current
          : (columnsRef.current = new Float32Array(Math.ceil(width)));
      let from = -1;
      let to = -1;
      for (let x = 0; x < width; x += 1) {
        const atSec = windowStart + x * secondsPerPixel;
        if (atSec < 0) continue;
        const firstBucket = Math.floor(atSec * p.peaksPerSecond);
        if (firstBucket >= wave.length) break;
        // The loudest bucket in the column, so a snare between two columns
        // does not vanish from the very picture it is being aligned by.
        const lastBucket = Math.min(
          wave.length,
          Math.max(firstBucket + 1, Math.floor((atSec + secondsPerPixel) * p.peaksPerSecond)),
        );
        let peak = 0;
        for (let i = firstBucket; i < lastBucket; i += 1) if (wave[i] > peak) peak = wave[i];
        columns[x] = peak * half;
        if (from < 0) from = x;
        to = x;
      }
      if (from >= 0) {
        ctx.fillStyle = TIMELINE_COLORS.wave;
        ctx.beginPath();
        ctx.moveTo(from, midY - columns[from]);
        for (let x = from + 1; x <= to; x += 1) ctx.lineTo(x, midY - columns[x]);
        for (let x = to; x >= from; x -= 1) ctx.lineTo(x, midY + columns[x]);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Before bar 1 the tab has nothing to say — shaded, so the start reads.
    const startSec = p.tempoMap.secForBeat(0);
    const startX = xOf(startSec);
    if (startX > 0) {
      ctx.fillStyle = INTRO_SHADE;
      ctx.fillRect(0, waveTop, Math.min(width, startX), waveH);
    }

    // ── Bar lines and numbers ─────────────────────────────────────────────
    const barLines = lines.filter((line) => line.isBarStart && line.bar !== null);
    const barGapPx =
      barLines.length > 1
        ? Math.abs(barLines[1].sec - barLines[0].sec) / secondsPerPixel
        : Number.POSITIVE_INFINITY;
    const labelEvery =
      barGapPx >= MIN_BAR_LABEL_GAP_PX
        ? 1
        : Math.max(2, Math.ceil(MIN_BAR_LABEL_GAP_PX / Math.max(1, barGapPx)));

    ctx.font = BAR_LABEL_FONT;
    ctx.textBaseline = "middle";
    for (const line of barLines) {
      if (line.bar === null) continue;
      // The line in hand is drawn from the gesture below, not from the map.
      if (drag?.moved && drag.beat === line.index) continue;
      const x = xOf(line.sec);
      const isStart = line.index === 0;
      const isPinned = !isStart && pinned.has(line.index);
      const isHot = hoverBeatRef.current === line.index && !drag;

      ctx.strokeStyle = isStart
        ? TIMELINE_COLORS.start
        : isPinned
          ? TIMELINE_COLORS.anchor
          : isHot
            ? TIMELINE_COLORS.playhead
            : TIMELINE_COLORS.barLine;
      ctx.lineWidth = isStart || isPinned || isHot ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      if (!isStart && line.bar !== 1 && (line.bar - 1) % labelEvery !== 0 && !isPinned) continue;
      const label = isStart ? p.words.bar1 : String(line.bar);
      let labelW = labelWidthRef.current.get(label);
      if (labelW === undefined) {
        labelW = ctx.measureText(label).width;
        labelWidthRef.current.set(label, labelW);
      }
      if (isStart) {
        // Bar 1 is the one every other is counted from, so it carries a flag.
        ctx.fillStyle = TIMELINE_COLORS.start;
        ctx.fillRect(x, 3, labelW + 12, RULER_PX - 6);
        ctx.fillStyle = "rgb(24, 24, 27)";
      } else {
        ctx.fillStyle = isPinned ? TIMELINE_COLORS.anchor : "rgb(228, 228, 231)";
      }
      ctx.fillText(label, x + 6, RULER_PX / 2);
    }
    ctx.lineWidth = 1;

    // ── The line in hand ──────────────────────────────────────────────────
    if (drag && drag.moved) {
      const ghostX = xOf(drag.originSec);
      const liveX = xOf(drag.currentSec);

      // Where it was, so the size of the correction is visible.
      ctx.strokeStyle = "rgba(161, 161, 170, 0.4)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(ghostX, 0);
      ctx.lineTo(ghostX, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Emerald says it locked onto an attack rather than where the hand stopped.
      ctx.strokeStyle = drag.snapped
        ? "rgb(52, 211, 153)"
        : drag.beat === 0
          ? TIMELINE_COLORS.start
          : TIMELINE_COLORS.anchor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(liveX, 0);
      ctx.lineTo(liveX, height);
      ctx.stroke();
      ctx.lineWidth = 1;

      const bar = Math.floor(drag.beat / Math.max(1, Math.round(p.beatsPerBar))) + 1;
      const value =
        drag.beat === 0
          ? formatMs(drag.currentSec * 1000)
          : `${formatBpm(bpmBetween({ beat: drag.limits.prevBeat, sec: drag.limits.prevSec }, { beat: drag.beat, sec: drag.currentSec }))} BPM`;
      const label = `${p.words.bar(bar)} · ${value}${drag.snapped ? ` · ${p.words.onBeat}` : ""}`;

      ctx.font = READOUT_FONT;
      const boxW = ctx.measureText(label).width + 14;
      const boxX = liveX + 10 + boxW > width ? liveX - 10 - boxW : liveX + 10;
      ctx.fillStyle = drag.snapped ? "rgba(16, 185, 129, 0.95)" : "rgba(24, 24, 27, 0.95)";
      ctx.fillRect(boxX, RULER_PX + 6, boxW, 20);
      ctx.fillStyle = drag.snapped ? "rgb(9, 20, 16)" : "rgb(244, 244, 245)";
      ctx.fillText(label, boxX + 7, RULER_PX + 16);
    }

    // ── Playhead ──────────────────────────────────────────────────────────
    const playheadX = xOf(playheadSec);
    if (playheadX >= 0 && playheadX <= width) {
      ctx.strokeStyle = TIMELINE_COLORS.playhead;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
    ctx.textBaseline = "alphabetic";
  });

  type PointerLike = React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>;

  const secAt = (event: PointerLike) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const { startSec, secondsPerPixel } = viewRef.current;
    return startSec + (event.clientX - rect.left) * secondsPerPixel;
  };

  /** The bar line within reach of the pointer, if any. */
  const barLineAt = (event: PointerLike): number | null =>
    barLineNear({
      sec: secAt(event),
      secondsPerPixel: viewRef.current.secondsPerPixel,
      tempoMap: paramsRef.current.tempoMap,
      beatsPerBar: paramsRef.current.beatsPerBar,
    });

  /** Where the line in hand lands for this pointer position. */
  const placeDrag = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const p = paramsRef.current;
    const placed = placeDraggedLine({
      originSec: drag.originSec,
      dragPx: event.clientX - drag.originX,
      secondsPerPixel: viewRef.current.secondsPerPixel,
      limits: drag.limits,
      peaks: p.peaks,
      peaksPerSecond: p.peaksPerSecond,
      onset: p.onset,
      onsetFps: p.onsetFps,
      // Alt is the universal "no, exactly here".
      exact: event.altKey,
    });
    drag.currentSec = placed.sec;
    drag.snapped = placed.snapped;
  };

  const commit = (realign: boolean) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.beat === 0) onOffsetChange(drag.currentSec * 1000, { realign });
    else onAnchorChange(drag.beat, drag.currentSec, { realign });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const beat = event.button === 1 ? null : barLineAt(event);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* pointer already released — the move handler still works */
    }

    if (beat === null) {
      panningRef.current = true;
      event.currentTarget.style.cursor = "grabbing";
      onPanStart(event.clientX);
      return;
    }

    onEditStart?.();
    lastCommitAtRef.current = Number.NEGATIVE_INFINITY;
    const map = paramsRef.current.tempoMap;
    const originSec = map.secForBeat(beat);
    dragRef.current = {
      beat,
      originX: event.clientX,
      // Where the line is, not where the pointer is — a grab a few pixels off
      // the line must not shunt it by those pixels.
      originSec,
      limits: dragLimits(map, beat),
      moved: false,
      currentSec: originSec,
      snapped: false,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (panningRef.current) {
      onPanMove(event.clientX);
      return;
    }
    const drag = dragRef.current;
    if (!drag) {
      const beat = barLineAt(event);
      hoverBeatRef.current = beat;
      event.currentTarget.style.cursor = beat === null ? "grab" : "ew-resize";
      return;
    }
    if (Math.abs(event.clientX - drag.originX) > 2) drag.moved = true;
    if (!drag.moved) return;
    placeDrag(event);
    // The line is painted from the gesture every frame, so React hears about it
    // less often — each write re-renders the session behind this editor.
    const now = performance.now();
    if (now - lastCommitAtRef.current < DRAG_COMMIT_MS) return;
    lastCommitAtRef.current = now;
    commit(false);
  };

  const endGesture = (event: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* never captured */
    }
    if (panningRef.current) {
      panningRef.current = false;
      event.currentTarget.style.cursor = "grab";
      onPanEnd();
      return;
    }
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.moved) {
      placeDrag(event);
      // One last write that re-seeks the recording to where it was let go.
      commit(true);
    }
    dragRef.current = null;
  };

  const handleDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const beat = barLineAt(event);
    // Bar 1 always exists, and an unpinned bar has nothing to let go of.
    if (beat === null || beat === 0) return;
    if (!paramsRef.current.tempoMap.points.some((point) => point.beat === beat)) return;
    onAnchorChange(beat, null, { realign: true });
  };

  return (
    <canvas
      ref={canvasRef}
      aria-label={t("lane.aria")}
      style={{ height: heightPx, cursor: "grab" }}
      className={cn("w-full touch-none select-none rounded-lg bg-zinc-900", className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      onPointerLeave={() => {
        hoverBeatRef.current = null;
      }}
      onDoubleClick={handleDoubleClick}
    />
  );
}
