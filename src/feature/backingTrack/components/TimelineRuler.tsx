import { cn } from "assets/lib/utils";
import type { MutableRefObject } from "react";
import { useEffect, useRef } from "react";

import { useCanvasSize, useTimelineFrame } from "../hooks/useTimelineFrame";
import { beatGridLines, secondsPerBeat, snapSecToTransient } from "../utils/alignment";
import type { ScoreClock } from "../utils/backingSync";
import { sessionBeats } from "../utils/backingSync";
import type { RecordingTempoMap } from "../utils/tempoMap";
import { MAX_TEMPO_BPM, MIN_TEMPO_BPM } from "../utils/tempoMap";
import { TIMELINE_COLORS } from "../utils/timelineColors";

/** Tempo chips on top, bar numbers and lines underneath. */
const TEMPO_ROW_PX = 18;
const HEIGHT_PX = 48;

/** How near the pointer has to be to a bar line to grab it, in CSS px. */
const GRAB_SLOP_PX = 7;

/**
 * How far either side of the drop the snap looks for an attack — in pixels, not
 * seconds.
 *
 * A window fixed in seconds is a few pixels zoomed out and most of the screen
 * zoomed in, so the closer you looked the more violently the line jumped. In
 * pixels it is always "about a finger's width", which is what makes the drag
 * feel gentle at every zoom.
 */
const SNAP_SLOP_PX = 10;

/**
 * BPM per pixel of drag, and the same with Shift held.
 *
 * Constant on purpose. A bar's tempo is `60 × beats / Δt`, a hyperbola, so
 * dragging the *position* linearly moves the tempo by `BPM² / (60 × beats)` per
 * second — which in practice ranged from 0.02 BPM a pixel on a long span zoomed
 * in, to over 5 on a short span zoomed out. Same gesture, two orders of
 * magnitude apart, which is impossible to build a feel for.
 *
 * Driving the BPM instead and deriving the position from it makes one pixel
 * always worth the same amount, at any zoom and any span.
 */
const BPM_PER_PX = 0.05;
const BPM_PER_PX_FINE = 0.01;

/** Bar numbers are read at a glance while listening — 10px grey was not enough. */
const BAR_LABEL_FONT = "700 12px ui-monospace, SFMono-Regular, Menlo, monospace";

/** Below this much room between bars, number only every second or fourth one. */
const MIN_BAR_LABEL_GAP_PX = 34;

/** The little tab drawn on every bar line so it reads as something you can grab. */
const GRIP_W = 11;
const GRIP_H = 3;

export interface TimelineWindow {
  startTime: number | null;
  effectiveBpm: number;
  /**
   * The session clock, so every lane reads the bar the session is actually
   * playing rather than the one an even beat count would suggest.
   *
   * A ref because it is rebuilt whenever a bar is pinned, and threading a fresh
   * object into six canvases would tear down their frame loops mid-drag.
   */
  scoreClockRef: MutableRefObject<ScoreClock | null>;
  /**
   * Where the next Play begins, for when the transport is stopped.
   *
   * Without it a stopped panel drew its playhead at bar 1, which is both wrong
   * and the one moment you most need to see where you are.
   */
  getResumeBeat?: () => number;
  sourceBpm: number;
  /** Assignment offset — where the tab's beat 0 falls in the recording. */
  offsetMs: number;
  /**
   * Where the tab's bars actually fall in the recording. With bars pinned by
   * hand this — not `sourceBpm` — is what places every line, so all the lanes
   * bend together instead of one of them keeping an even grid.
   */
  tempoMap: RecordingTempoMap;
  beatsPerBar: number;
  windowSec: number;
  centreSecOverride: number | null;
}

export interface TempoEditing {
  /** Bar whose tempo the toolbar is editing numerically, so it can be marked. */
  selectedBeat?: number | null;
  /** Clicking a bar line without dragging picks it for that numeric field. */
  onSelectBar?: (beat: number | null) => void;
  /**
   * The recording's waveform, so a dragged bar line can be pulled onto the
   * attack it belongs on. Null for YouTube, where there is no waveform to read —
   * dragging still works, it just lands exactly where it is dropped.
   */
  peaks: Float32Array | null;
  peaksPerSecond: number;
  /**
   * Pins bar `beat` to a moment in the recording, or unpins it with null.
   * Called continuously while dragging, hence the same `realign` convention the
   * offset controls use.
   */
  onAnchorChange: (beat: number, sec: number | null, options?: { realign?: boolean }) => void;
  /** Bar 1 is the offset, not an anchor, so dragging it moves that instead. */
  onOffsetChange: (offsetMs: number, options?: { realign?: boolean }) => void;
  /**
   * A bar line has been grabbed.
   *
   * The screen parks the view on this, because a following view is centred on
   * the playhead and the playhead sits at the offset — so dragging bar 1 used
   * to slide the whole picture and leave the line pinned under the cursor,
   * doing visibly nothing while it was in fact moving.
   */
  onEditStart?: () => void;
}

/** Trims float noise while keeping the tenths that matter: 91.6 stays 91.6. */
const formatBpm = (bpm: number): string => (Math.round(bpm * 10) / 10).toFixed(1);

/**
 * The bar ruler every lane is read against: bar numbers, where the tab starts,
 * and — when tempo editing is on — a draggable handle on every bar line.
 *
 * Drawn once above the lanes rather than repeated in each, the way a DAW puts a
 * single timeline over its track stack. Tempo lives here for the same reason it
 * does in a DAW: the lanes below are for moving audio around, and overloading
 * them with a second meaning for a drag would make both harder to hit.
 */
export function TimelineRuler({
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
  tempoEditing,
  className,
}: TimelineWindow & { tempoEditing?: TempoEditing; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizeRef = useCanvasSize(canvasRef, HEIGHT_PX);

  const paramsRef = useRef({
    startTime, effectiveBpm, scoreClockRef, getResumeBeat, sourceBpm, offsetMs, tempoMap,
    beatsPerBar, windowSec, centreSecOverride, tempoEditing,
  });
  useEffect(() => {
    paramsRef.current = {
      startTime, effectiveBpm, scoreClockRef, getResumeBeat, sourceBpm, offsetMs, tempoMap,
      beatsPerBar, windowSec, centreSecOverride, tempoEditing,
    };
  });

  /** Window the last frame drew, so pointer maths matches what is on screen. */
  const viewRef = useRef({ startSec: 0, secondsPerPixel: 0.004 });
  /**
   * The bar line being dragged, plus where the gesture began.
   *
   * Tracking the origin rather than reading the pointer's absolute position is
   * what lets Shift scale the movement down — the line then follows a fraction
   * of the hand, instead of jumping to wherever the cursor happens to be.
   */
  const dragRef = useRef<{
    beat: number;
    originX: number;
    /** Where the line sat when the grab began — bar 1 is dragged by position. */
    originSec: number;
    /** The tempo it had, which the drag moves linearly.  */
    originBpm: number;
    /** The anchor the span is measured from. */
    prevBeat: number;
    prevSec: number;
    /** Cleared the moment the pointer travels, so a click can select instead. */
    moved: boolean;
    /** Where the line is being held right now, for the ghost and the readout. */
    currentSec: number;
    /** Whether that landed on a transient rather than wherever the hand was. */
    snapped: boolean;
  } | null>(null);
  /** Beat of the bar line under the pointer — drawn as a hint. */
  const hoverBeatRef = useRef<number | null>(null);
  /** Signature of the last frame drawn, so an idle ruler stops repainting. */
  const lastFrameKeyRef = useRef("");

  useTimelineFrame(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = ctxRef.current ?? (ctxRef.current = canvas.getContext("2d"));
    if (!ctx) return;

    const p = paramsRef.current;
    const { width, devicePixelRatio: dpr } = sizeRef.current;
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

    // Nothing on this ruler animates by itself. Half-pixel resolution on the
    // moving parts is enough to catch every visible change.
    const activeDrag = dragRef.current;
    const frameKey = [
      width, p.windowSec, p.offsetMs, p.beatsPerBar,
      // Quantised to the pixel each value lands on rather than to a slice of a
      // second. Five milliseconds is finer than a frame, so the old key changed
      // on literally every frame and the early-out never once fired — a parked
      // lane redrew itself sixty times a second to show the same picture.
      Math.round(windowStart / secondsPerPixel), Math.round(playheadSec / secondsPerPixel),
      p.tempoMap.points.length, p.tempoEditing?.selectedBeat ?? -1,
      hoverBeatRef.current ?? -1,
      activeDrag
        ? `${activeDrag.beat}:${Math.round(activeDrag.currentSec * 1000)}:${activeDrag.snapped}`
        : "",
    ].join("|");
    if (frameKey === lastFrameKeyRef.current) return;
    lastFrameKeyRef.current = frameKey;

    // Clearing before deciding whether to draw is what makes a skipped frame
    // show as a blank one — the wipe has to wait until the frame is committed to.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, HEIGHT_PX);

    const lines = beatGridLines({
      windowStartSec: windowStart,
      windowEndSec: windowEnd,
      sourceBpm: p.sourceBpm,
      offsetMs: p.offsetMs,
      beatsPerBar: p.beatsPerBar,
      tempoMap: p.tempoMap,
    });

    // Bars carrying an anchor of their own are the ones the tempo changes at.
    const anchored = new Set(p.tempoMap.points.map((point) => point.beat));

    // How far apart the bars are on screen decides how many can be numbered
    // without the digits running into each other.
    const barLines = lines.filter((line) => line.isBarStart && line.bar !== null);
    const barGapPx =
      barLines.length > 1
        ? Math.abs(barLines[1].sec - barLines[0].sec) / secondsPerPixel
        : Number.POSITIVE_INFINITY;
    const labelEvery = barGapPx >= MIN_BAR_LABEL_GAP_PX
      ? 1
      : Math.max(2, Math.ceil(MIN_BAR_LABEL_GAP_PX / Math.max(1, barGapPx)));

    ctx.textBaseline = "alphabetic";
    for (const line of lines) {
      const x = Math.round((line.sec - windowStart) / secondsPerPixel) + 0.5;
      ctx.strokeStyle = line.isBarStart
        ? TIMELINE_COLORS.barLine
        : TIMELINE_COLORS.beatLine;
      ctx.beginPath();
      ctx.moveTo(x, line.isBarStart ? TEMPO_ROW_PX + 8 : TEMPO_ROW_PX + 18);
      ctx.lineTo(x, HEIGHT_PX);
      ctx.stroke();

      if (!line.isBarStart || line.bar === null) continue;
      // Bar 1 always earns a number; it is the one every other is counted from.
      if (line.bar !== 1 && (line.bar - 1) % labelEvery !== 0) continue;

      const label = String(line.bar);
      ctx.font = BAR_LABEL_FONT;
      const labelW = ctx.measureText(label).width;
      // A plate behind the digits, so the number reads against a busy waveform
      // instead of dissolving into the grid lines.
      ctx.fillStyle = "rgba(9, 9, 11, 0.85)";
      ctx.fillRect(x + 3, TEMPO_ROW_PX + 3, labelW + 6, 15);
      ctx.fillStyle = "rgb(228, 228, 231)";
      ctx.fillText(label, x + 6, TEMPO_ROW_PX + 15);
    }

    // ── Tempo handles ─────────────────────────────────────────────────────
    if (p.tempoEditing) {
      // Every bar line gets a grip, whether or not it carries a tempo. Without
      // one an untouched ruler looks like decoration, and nothing says the
      // lines are the control.
      ctx.fillStyle = "rgba(113, 113, 122, 0.55)";
      for (const line of lines) {
        if (!line.isBarStart || line.bar === null) continue;
        const x = Math.round((line.sec - windowStart) / secondsPerPixel) + 0.5;
        ctx.fillRect(x - GRIP_W / 2, 1, GRIP_W, GRIP_H);
      }

      for (const line of lines) {
        if (!line.isBarStart || line.bar === null) continue;
        const x = Math.round((line.sec - windowStart) / secondsPerPixel) + 0.5;
        const isAnchored = anchored.has(line.index);
        const isActive = dragRef.current?.beat === line.index;
        const isHovered = hoverBeatRef.current === line.index;
        const isSelected = p.tempoEditing.selectedBeat === line.index;
        if (!isAnchored && !isHovered && !isActive && !isSelected) continue;

        // A pinned bar is the start of a tempo, so it shows the tempo it
        // starts. An un-pinned one under the pointer shows what it would
        // inherit, which is what you are about to change.
        const bpm = p.tempoMap.bpmAtBeat(line.index);
        ctx.font = "600 10px ui-monospace, monospace";
        const label = formatBpm(bpm);
        const labelW = ctx.measureText(label).width + 14;

        ctx.fillStyle = isSelected
          ? TIMELINE_COLORS.tab
          : isAnchored
            ? isActive || isHovered
              ? TIMELINE_COLORS.anchor
              : TIMELINE_COLORS.anchorQuiet
            : "rgba(113, 113, 122, 0.55)";
        ctx.fillRect(x, 0, labelW, TEMPO_ROW_PX - 2);

        // The stem down to the bar line, so the chip reads as belonging to it.
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = isAnchored || isSelected ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, HEIGHT_PX);
        ctx.stroke();
        ctx.lineWidth = 1;

        ctx.fillStyle = "rgb(24, 24, 27)";
        ctx.fillText(label, x + 4, TEMPO_ROW_PX - 6);
      }
    }

    // ── Live drag feedback ────────────────────────────────────────────────
    const drag = dragRef.current;
    if (drag && drag.moved) {
      const ghostX = Math.round((drag.originSec - windowStart) / secondsPerPixel) + 0.5;
      const liveX = Math.round((drag.currentSec - windowStart) / secondsPerPixel) + 0.5;

      // Where it was, so the size of the correction is visible.
      ctx.strokeStyle = "rgba(161, 161, 170, 0.35)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(ghostX, 0);
      ctx.lineTo(ghostX, HEIGHT_PX);
      ctx.stroke();
      ctx.setLineDash([]);

      // Emerald says the line locked onto an attack rather than landing where
      // the hand happened to stop — the one thing a drag cannot otherwise tell.
      const locked = drag.snapped;
      const wasBpm = drag.originBpm;
      const nowBpm =
        drag.beat === 0
          ? wasBpm
          : ((drag.beat - drag.prevBeat) * 60) / Math.max(1e-6, drag.currentSec - drag.prevSec);
      const label =
        drag.beat === 0
          ? `${(drag.currentSec * 1000).toFixed(0)} ms`
          : `${formatBpm(nowBpm)}${locked ? "  on beat" : ""}`;
      const was = drag.beat === 0 ? null : `was ${formatBpm(wasBpm)}`;

      ctx.font = "600 11px ui-monospace, monospace";
      const boxW = Math.max(ctx.measureText(label).width, was ? ctx.measureText(was).width : 0) + 12;
      const boxH = was ? 30 : 18;
      // Flip to the left near the right edge so the readout never leaves the lane.
      const boxX = Math.min(liveX + 10, width - boxW - 2);

      ctx.fillStyle = locked ? "rgba(16, 185, 129, 0.95)" : "rgba(24, 24, 27, 0.95)";
      ctx.fillRect(boxX, 2, boxW, boxH);
      ctx.fillStyle = locked ? "rgb(9, 20, 16)" : "rgb(244, 244, 245)";
      ctx.textBaseline = "middle";
      ctx.fillText(label, boxX + 6, 11);
      if (was) {
        ctx.fillStyle = locked ? "rgba(9, 20, 16, 0.7)" : "rgba(161, 161, 170, 0.9)";
        ctx.fillText(was, boxX + 6, 25);
      }
      ctx.textBaseline = "alphabetic";
    }

    // ── Start marker ──────────────────────────────────────────────────────
    // The single most useful thing on this screen: the point in the recording
    // the tab's first beat is pinned to.
    const startX = (p.tempoMap.secForBeat(0) - windowStart) / secondsPerPixel;
    if (startX >= -60 && startX <= width + 60) {
      const x = Math.round(startX) + 0.5;
      ctx.strokeStyle = TIMELINE_COLORS.start;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, TEMPO_ROW_PX);
      ctx.lineTo(x, HEIGHT_PX);
      ctx.stroke();

      const label = "START";
      const labelW = ctx.measureText(label).width + 10;
      ctx.fillStyle = TIMELINE_COLORS.start;
      ctx.fillRect(x, TEMPO_ROW_PX, labelW, 14);
      ctx.fillStyle = "rgb(24, 24, 27)";
      ctx.fillText(label, x + 5, TEMPO_ROW_PX + 11);
      ctx.lineWidth = 1;
    }

    // ── Playhead ──────────────────────────────────────────────────────────
    const playheadX = Math.round((playheadSec - windowStart) / secondsPerPixel) + 0.5;
    if (playheadX >= 0 && playheadX <= width) {
      ctx.strokeStyle = TIMELINE_COLORS.playhead;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, HEIGHT_PX);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
  });

  /** Recording second under a pointer event. */
  const secAt = (event: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const { startSec, secondsPerPixel } = viewRef.current;
    return startSec + (event.clientX - rect.left) * secondsPerPixel;
  };

  /** The bar line within grabbing distance of a pointer event, if any. */
  const barLineAt = (
    event: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>,
  ): number | null => {
    const p = paramsRef.current;
    if (!p.tempoEditing) return null;
    const { secondsPerPixel } = viewRef.current;
    const sec = secAt(event);
    const perBar = Math.max(1, Math.round(p.beatsPerBar));

    // Round the pointer to the nearest bar, then check it is actually close —
    // between bars there is nothing to grab.
    const beatAt = p.tempoMap.beatForSec(sec);
    const nearestBar = Math.round(beatAt / perBar) * perBar;
    if (nearestBar < 0) return null;
    const distancePx = Math.abs(p.tempoMap.secForBeat(nearestBar) - sec) / secondsPerPixel;
    return distancePx <= GRAB_SLOP_PX ? nearestBar : null;
  };

  /** Where a bar line dropped here should land, transient snap included. */
  const dropSecFor = (
    event: React.PointerEvent<HTMLCanvasElement>,
    drag: NonNullable<typeof dragRef.current>,
  ): { sec: number; snapped: boolean } => {
    const p = paramsRef.current;
    const { secondsPerPixel } = viewRef.current;
    const dx = event.clientX - drag.originX;

    // Bar 1 is the offset, not a tempo — there is no span before it to stretch,
    // so it is dragged by position and follows the pointer exactly.
    const raw =
      drag.beat === 0
        ? drag.originSec + dx * secondsPerPixel
        : (() => {
            const perPx = event.shiftKey ? BPM_PER_PX_FINE : BPM_PER_PX;
            // Rightwards is later, which is slower.
            const bpm = Math.min(
              MAX_TEMPO_BPM,
              Math.max(MIN_TEMPO_BPM, drag.originBpm - dx * perPx),
            );
            return drag.prevSec + ((drag.beat - drag.prevBeat) * 60) / bpm;
          })();

    // Alt is the universal "no, exactly here" modifier.
    if (event.altKey || !p.tempoEditing) return { sec: raw, snapped: false };

    const snapped = snapSecToTransient({
      sec: raw,
      peaks: p.tempoEditing.peaks,
      peaksPerSecond: p.tempoEditing.peaksPerSecond,
      toleranceSec: SNAP_SLOP_PX * secondsPerPixel,
    });
    if (snapped === null) return { sec: raw, snapped: false };

    // A bar can never be dragged onto or behind its neighbour: that would be a
    // span of no length, which is an infinite tempo.
    if (drag.beat > 0 && snapped <= drag.prevSec) return { sec: raw, snapped: false };
    return { sec: snapped, snapped: true };
  };

  const applyDrop = (
    event: React.PointerEvent<HTMLCanvasElement>,
    drag: NonNullable<typeof dragRef.current>,
    realign: boolean,
  ) => {
    const editing = paramsRef.current.tempoEditing;
    if (!editing) return;
    const { sec, snapped } = dropSecFor(event, drag);
    drag.currentSec = sec;
    drag.snapped = snapped;
    // Bar 1 is not an anchor — it is the offset, the thing every other bar is
    // measured from — so dragging it moves that instead.
    if (drag.beat === 0) editing.onOffsetChange(sec * 1000, { realign });
    else editing.onAnchorChange(drag.beat, sec, { realign });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const beat = barLineAt(event);
    if (beat === null) return;
    paramsRef.current.tempoEditing?.onEditStart?.();
    const map = paramsRef.current.tempoMap;
    const previous = map.points.filter((point) => point.beat < beat).pop();
    dragRef.current = {
      beat,
      originX: event.clientX,
      // Where the line is now, not where the pointer is — a grab a few pixels
      // off the line must not shunt it by those pixels.
      originSec: map.secForBeat(beat),
      originBpm: map.bpmAtBeat(Math.max(0, beat - 1)),
      prevBeat: previous?.beat ?? 0,
      prevSec: previous?.sec ?? map.secForBeat(0),
      moved: false,
      currentSec: map.secForBeat(beat),
      snapped: false,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* pointer already released — the move handler still works */
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag) {
      hoverBeatRef.current = barLineAt(event);
      return;
    }
    if (Math.abs(event.clientX - drag.originX) > 2) drag.moved = true;
    if (drag.moved) applyDrop(event, drag, false);
  };

  const endDrag = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* never captured */
    }
    // A grab that never travelled is a click: pick this bar for the numeric
    // field rather than nudging it by a pixel of hand tremor.
    if (!drag.moved) {
      paramsRef.current.tempoEditing?.onSelectBar?.(drag.beat);
      return;
    }
    // One last write that re-seeks the recording to where it was let go.
    applyDrop(event, drag, true);
  };

  const handleDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const editing = paramsRef.current.tempoEditing;
    const beat = barLineAt(event);
    // Bar 1 always exists, so there is nothing there to clear.
    if (!editing || beat === null || beat === 0) return;
    editing.onAnchorChange(beat, null, { realign: true });
  };

  return (
    <canvas
      ref={canvasRef}
      aria-label={
        tempoEditing
          ? "Bar ruler — drag a bar line onto the beat you hear, Shift for fine, double-click to unpin it"
          : undefined
      }
      aria-hidden={tempoEditing ? undefined : true}
      style={{ height: HEIGHT_PX }}
      className={cn(
        "w-full rounded-t-lg bg-zinc-900",
        tempoEditing && "cursor-ew-resize touch-none",
        className,
      )}
      onPointerDown={tempoEditing ? handlePointerDown : undefined}
      onPointerMove={tempoEditing ? handlePointerMove : undefined}
      onPointerUp={tempoEditing ? endDrag : undefined}
      onPointerCancel={tempoEditing ? endDrag : undefined}
      onPointerLeave={tempoEditing ? () => { hoverBeatRef.current = null; } : undefined}
      onDoubleClick={tempoEditing ? handleDoubleClick : undefined}
    />
  );
}

/** Shared by the ruler and every lane, so a beat sits at the same x in all of them. */
export function beatWidthPx(windowSec: number, widthPx: number, sourceBpm: number): number {
  return (secondsPerBeat(sourceBpm) / windowSec) * widthPx;
}
