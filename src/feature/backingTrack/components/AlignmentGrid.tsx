import { cn } from "assets/lib/utils";
import type { MutableRefObject } from "react";
import { useEffect, useRef } from "react";

import { useCanvasSize, useTimelineFrame } from "../hooks/useTimelineFrame";
import { beatGridLines, DRAG_COMMIT_MS, offsetDeltaFromDrag } from "../utils/alignment";
import type { ScoreClock } from "../utils/backingSync";
import { sessionBeats } from "../utils/backingSync";
import type { RecordingTempoMap } from "../utils/tempoMap";
import { TIMELINE_COLORS } from "../utils/timelineColors";

interface AlignmentGridProps {
  /** Normalised magnitudes, or null when the source's audio can't be read. */
  peaks: Float32Array | null;
  peaksPerSecond: number;
  /** Bumped when the peaks' contents changed without their length changing —
   *  see the same prop on AlignmentOverview. */
  revision?: number;
  startTime: number | null;
  effectiveBpm: number;
  /** The session clock — see the same prop on TimelineWindow. */
  scoreClockRef: MutableRefObject<ScoreClock | null>;
  /** Where the next Play begins — see the same prop on TimelineWindow. */
  getResumeBeat?: () => number;
  sourceBpm: number;
  offsetMs: number;
  /** Places every grid line — see the same prop on TimelineWindow. */
  tempoMap: RecordingTempoMap;
  /**
   * Colour for this lane's waveform.
   *
   * Every stem drawn the same grey makes a stack of them unreadable — you
   * cannot tell the guitar from the vocal without reading the header each time.
   * Defaults to neutral, which is right for the one lane that has no siblings
   * to be told apart from: the video's own audio.
   */
  waveColor?: string;
  beatsPerBar: number;
  /** Seconds of recording visible across the lane — the zoom level. */
  windowSec: number;
  /** Where to look while paused. Null follows the playhead. */
  centreSecOverride: number | null;
  heightPx: number;
  /** This stem's own shift on top of `offsetMs`, in ms. Slides the waveform
   *  against a grid that stays put — a DAW dragging one clip, not the timeline. */
  stemOffsetMs?: number;
  /** Called with how far the drag moved the offset, in ms — never an absolute
   *  value, because only the caller knows which offset this lane is editing.
   *  `realign: false` while dragging; one seek per pointer event would stutter. */
  onDragOffset: (deltaMs: number, options?: { realign?: boolean }) => void;
  /**
   * Which of the two offsets `onDragOffset` ends up moving.
   *
   * The lane draws a drag before it has been committed (see DRAG_COMMIT_MS), so
   * it has to know which number to watch for the commit landing — otherwise the
   * preview and the real thing would be added together and the recording would
   * move twice as far as the hand.
   */
  dragEdits?: "offset" | "stemOffset";
  /**
   * What a plain left-drag across this lane does.
   *
   * Dragging used to mean one thing — move the audio — which left no way to look
   * anywhere else, since the only other view control was clicking the overview.
   * The middle button always pans regardless, the way it does in every editor.
   */
  dragMode?: "pan" | "stems";
  onPanStart?: (clientX: number) => void;
  onPanMove?: (clientX: number) => void;
  onPanEnd?: () => void;
  className?: string;
}

/**
 * The detail lane: the recording's own timeline under a fixed playhead, with the
 * tab's beats and bar numbers drawn over it.
 *
 * With a waveform (local file) alignment is a visual job — drag until the
 * transients sit on the bar lines. Without one (YouTube, whose audio is behind a
 * cross-origin iframe) the ruler still shows the beat sweeping past the
 * playhead, which is what makes tapping along possible.
 *
 * Painted on a canvas from its own animation frame: the lane repaints ~60×/s and
 * must never re-render the practice session to do it.
 */
export function AlignmentGrid({
  peaks,
  peaksPerSecond,
  revision = 0,
  startTime,
  effectiveBpm,
  scoreClockRef,
  getResumeBeat,
  sourceBpm,
  offsetMs,
  tempoMap,
  waveColor = TIMELINE_COLORS.wave,
  beatsPerBar,
  windowSec,
  centreSecOverride,
  heightPx,
  stemOffsetMs = 0,
  onDragOffset,
  dragEdits = "offset",
  dragMode = "stems",
  onPanStart,
  onPanMove,
  onPanEnd,
  className,
}: AlignmentGridProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizeRef = useCanvasSize(canvasRef, heightPx);
  const dragXRef = useRef<number | null>(null);
  /** Which of the two things this particular gesture turned out to be. */
  const gestureRef = useRef<"pan" | "stems" | null>(null);
  /** Signature of the last frame drawn, so an idle lane stops repainting. */
  const lastFrameKeyRef = useRef("");
  /** One column's half-height per pixel of lane width, reused every frame —
   *  a fresh array per lane per frame is a megabyte a second of garbage for a
   *  buffer whose size only changes when the window does. */
  const columnsRef = useRef<Float32Array | null>(null);
  /** Total this drag has moved, and the offset it started from. What is drawn
   *  but not yet committed is the difference between the two — see the draw. */
  const dragTotalMsRef = useRef(0);
  const dragFromMsRef = useRef(0);
  /** How much of the drag has been handed to React, so a throttled commit
   *  sends the rest exactly once. */
  const dragSentMsRef = useRef(0);
  const lastCommitAtRef = useRef(0);

  // The frame loop reads the latest values without being torn down and rebuilt
  // on every offset change — dragging changes the offset continuously.
  const paramsRef = useRef({
    peaks,
    peaksPerSecond,
    revision,
    startTime,
    effectiveBpm,
    scoreClockRef,
    getResumeBeat,
    sourceBpm,
    offsetMs,
    tempoMap,
    waveColor,
    beatsPerBar,
    windowSec,
    centreSecOverride,
    heightPx,
    dragEdits,
    stemOffsetMs,
  });
  useEffect(() => {
    paramsRef.current = {
      peaks,
      peaksPerSecond,
      revision,
      startTime,
      effectiveBpm,
      scoreClockRef,
      getResumeBeat,
      sourceBpm,
      offsetMs,
      tempoMap,
      waveColor,
      beatsPerBar,
      windowSec,
      centreSecOverride,
      heightPx,
      dragEdits,
      stemOffsetMs,
    };
  });

  useTimelineFrame(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Cached: fetching a 2d context is cheap but not free, and there is one
    // of these lanes per stem.
    const ctx = ctxRef.current ?? (ctxRef.current = canvas.getContext("2d"));
    if (!ctx) return;

    const p = paramsRef.current;
    const { width, devicePixelRatio: dpr } = sizeRef.current;
    const height = p.heightPx;
    if (width === 0) return;
    // Where the recording is right now, in its own seconds. Before the session
    // starts that's simply the offset, so the lane opens on the intro.
    const beats = sessionBeats(
      Date.now(), p.startTime, p.effectiveBpm, p.scoreClockRef.current, p.getResumeBeat,
    );
    const playheadSec = p.tempoMap.secForBeat(beats);
    const centreSec = p.centreSecOverride ?? playheadSec;

    const windowStart = centreSec - p.windowSec / 2;
    const windowEnd = centreSec + p.windowSec / 2;
    const secondsPerPixel = p.windowSec / width;
    const waveH = height;
    const midY = waveH / 2;

    /**
     * How far this drag has moved the recording without React having been told.
     *
     * Handing every pointer event to React re-rendered the practice session
     * around sixty times a second, which is what made dragging in here stutter.
     * The commit is throttled instead (DRAG_COMMIT_MS) and the frames in
     * between draw the difference themselves.
     *
     * Derived from the offset rather than counted down: the instant a commit
     * lands, the sum comes out at exactly what has already been drawn, so the
     * picture never jumps back a frame and then forward again.
     */
    const dragged = p.dragEdits === "stemOffset" ? p.stemOffsetMs : p.offsetMs;
    let previewMs = 0;
    if (dragTotalMsRef.current !== 0) {
      previewMs = dragTotalMsRef.current - (dragged - dragFromMsRef.current);
      // Let go, and the last commit landed: back to drawing what is stored.
      if (dragXRef.current === null && Math.abs(previewMs) < 0.5) {
        dragTotalMsRef.current = 0;
        previewMs = 0;
      }
    }

    // The waveform loop is one pass per pixel of width; with several stems on
    // screen that is the difference between a smooth drag and a stuttering one.
    const frameKey = [
      width, height, p.windowSec, p.offsetMs, p.stemOffsetMs, p.beatsPerBar,
      // Quantised to the pixel each value lands on rather than to a slice of a
      // second. Five milliseconds is finer than a frame, so the old key changed
      // on literally every frame and the early-out never once fired — a parked
      // lane redrew itself sixty times a second to show the same picture.
      Math.round(windowStart / secondsPerPixel), Math.round(playheadSec / secondsPerPixel),
      Math.round(previewMs / 1000 / secondsPerPixel),
      p.peaks?.length ?? 0, p.revision, p.tempoMap.points.length,
    ].join("|");
    if (frameKey === lastFrameKeyRef.current) return;
    lastFrameKeyRef.current = frameKey;

    // Clearing before deciding whether to draw is what makes a skipped frame
    // show as a blank one — the wipe has to wait until the frame is committed to.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // ── The grid, in two passes ───────────────────────────────────────────
    // Plain beats belong *under* the waveform: they are texture, and a lane
    // hatched with lines drawn over the picture is what made the picture hard
    // to read. Bar starts belong over it — those are the marks a transient is
    // dragged onto, and one buried under a loud bar is a mark you cannot use.
    //
    // Both are zinc, the same zinc the ruler above draws them in. They used to
    // be cyan here and neutral there, so a bar line changed colour halfway down
    // the screen — and cyan is the tablature's, which is the one thing on this
    // timeline the grid must not be mistaken for.
    const lines = beatGridLines({
      windowStartSec: windowStart,
      windowEndSec: windowEnd,
      sourceBpm: p.sourceBpm,
      offsetMs: p.offsetMs,
      beatsPerBar: p.beatsPerBar,
      tempoMap: p.tempoMap,
      secondsPerPixel,
    });

    // One path per pass rather than one per line: a bar of sixteenths at this
    // zoom is dozens of strokes for what is a single shape.
    const drawGrid = (barStarts: boolean) => {
      ctx.strokeStyle = barStarts ? TIMELINE_COLORS.barLine : TIMELINE_COLORS.beatLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const line of lines) {
        if (line.isBarStart !== barStarts) continue;
        const x = Math.round((line.sec - windowStart) / secondsPerPixel) + 0.5;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      ctx.stroke();
    };

    drawGrid(false);

    // ── Waveform ──────────────────────────────────────────────────────────
    if (p.peaks && p.peaks.length > 0) {
      const wave = p.peaks;
      const half = waveH / 2 - 4;
      const columns =
        columnsRef.current && columnsRef.current.length >= width
          ? columnsRef.current
          : (columnsRef.current = new Float32Array(Math.ceil(width)));

      // Measure first, draw second. `atSec` only grows, so the columns that
      // have audio behind them are one unbroken run — everything before the
      // recording starts and after it ends simply isn't part of the shape.
      let from = -1;
      let to = -1;
      for (let x = 0; x < width; x += 1) {
        // The axis is the recording's shared timeline; this stem's own audio
        // sits at its shift from it.
        const atSec =
          windowStart + previewMs / 1000 + x * secondsPerPixel + p.stemOffsetMs / 1000;
        if (atSec < 0) continue;
        const firstBucket = Math.floor(atSec * p.peaksPerSecond);
        if (firstBucket >= wave.length) break;
        // Zoomed out a column spans many buckets, and reading only the first
        // of them drops transients between columns — a snare that lands in the
        // wrong half of a pixel disappears from the very picture it is being
        // aligned by. The loudest bucket in the column is what a DAW shows.
        const lastBucket = Math.min(
          wave.length,
          Math.max(firstBucket + 1, Math.floor((atSec + secondsPerPixel) * p.peaksPerSecond)),
        );
        let peak = 0;
        for (let i = firstBucket; i < lastBucket; i += 1) {
          if (wave[i] > peak) peak = wave[i];
        }
        columns[x] = peak * half;
        if (from < 0) from = x;
        to = x;
      }

      // One closed shape rather than a rectangle per column: `rect()` is five
      // path operations, so a lane's worth was eight thousand of them a frame,
      // per stem, for what the eye reads as a single silhouette.
      if (from >= 0) {
        ctx.fillStyle = p.waveColor;
        ctx.beginPath();
        ctx.moveTo(from, midY - columns[from]);
        for (let x = from + 1; x <= to; x += 1) ctx.lineTo(x, midY - columns[x]);
        for (let x = to; x >= from; x -= 1) ctx.lineTo(x, midY + columns[x]);
        ctx.closePath();
        ctx.fill();
      }
    }

    // ── Bar starts, over the wave they are read against ───────────────────
    drawGrid(true);

    // ── Start marker ──────────────────────────────────────────────────────
    const startX = (p.offsetMs / 1000 - windowStart) / secondsPerPixel;
    if (startX >= 0 && startX <= width) {
      ctx.strokeStyle = TIMELINE_COLORS.start;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.round(startX) + 0.5, 0);
      ctx.lineTo(Math.round(startX) + 0.5, height);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    // ── Playhead ──────────────────────────────────────────────────────────
    const playheadX = Math.round((playheadSec - windowStart) / secondsPerPixel) + 0.5;
    if (playheadX >= 0 && playheadX <= width) {
      ctx.strokeStyle = TIMELINE_COLORS.playhead;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
    }
  });

  /** Hands React everything dragged since the last time it was told. */
  const commitDrag = (realign: boolean) => {
    const unsent = dragTotalMsRef.current - dragSentMsRef.current;
    dragSentMsRef.current = dragTotalMsRef.current;
    // A realign with nothing left to send still goes through: that is what
    // re-seeks the recording to where the user let go.
    if (unsent !== 0 || realign) onDragOffset(unsent, { realign });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    // Middle button is the universal "just move the view", whatever the mode.
    const gesture = event.button === 1 || dragMode === "pan" ? "pan" : "stems";
    gestureRef.current = gesture;
    dragXRef.current = event.clientX;
    if (gesture === "pan") onPanStart?.(event.clientX);
    else {
      dragTotalMsRef.current = 0;
      dragSentMsRef.current = 0;
      dragFromMsRef.current = dragEdits === "stemOffset" ? stemOffsetMs : offsetMs;
      // The first movement commits at once: the throttle is there to thin out a
      // continuous drag, not to make the start of one feel late.
      lastCommitAtRef.current = Number.NEGATIVE_INFINITY;
    }
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* pointer already released — dragging still works via the move handler */
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const lastX = dragXRef.current;
    if (lastX === null) return;

    if (gestureRef.current === "pan") {
      dragXRef.current = event.clientX;
      onPanMove?.(event.clientX);
      return;
    }

    const width = event.currentTarget.clientWidth || 1;
    dragXRef.current = event.clientX;
    dragTotalMsRef.current += offsetDeltaFromDrag({
      dragPx: event.clientX - lastX,
      secondsPerPixel: paramsRef.current.windowSec / width,
    });

    // The frames in between are drawn from `dragTotalMsRef` above, so nothing
    // is lost by telling React less often — and telling it on every pointer
    // event is a re-render of the whole session per event.
    const now = performance.now();
    if (now - lastCommitAtRef.current < DRAG_COMMIT_MS) return;
    lastCommitAtRef.current = now;
    // Mid-drag the corrector absorbs the change smoothly; a forced seek on
    // every commit would stutter the audio all the way across.
    commitDrag(false);
  };

  const endDrag = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragXRef.current === null) return;
    const gesture = gestureRef.current;
    dragXRef.current = null;
    gestureRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* never captured */
    }
    if (gesture === "pan") {
      onPanEnd?.();
      return;
    }
    // Whatever the throttle was still holding, then a seek to where it landed.
    commitDrag(true);
  };

  return (
    <canvas
      ref={canvasRef}
      aria-label={
        dragMode === "pan"
          ? "Backing track alignment grid — drag to move the view"
          : "Backing track alignment grid — drag to shift the recording"
      }
      style={{ height: heightPx }}
      className={cn(
        "w-full touch-none rounded-lg bg-zinc-900/60",
        dragMode === "pan" ? "cursor-grab active:cursor-grabbing" : "cursor-ew-resize",
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    />
  );
}
