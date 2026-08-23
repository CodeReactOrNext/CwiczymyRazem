import { cn } from "assets/lib/utils";
import type { MutableRefObject } from "react";
import { useEffect, useRef } from "react";

import { useCanvasSize, useTimelineFrame } from "../hooks/useTimelineFrame";
import type { ScoreClock } from "../utils/backingSync";
import { sessionBeats } from "../utils/backingSync";
import type { RecordingTempoMap } from "../utils/tempoMap";
import { TIMELINE_COLORS } from "../utils/timelineColors";

interface AlignmentOverviewProps {
  peaks: Float32Array | null;
  peaksPerSecond: number;
  durationSec: number;
  /** Same clock and zoom the detail lane uses, so the viewport box can be
   *  derived here instead of being pushed through state every frame. */
  startTime: number | null;
  effectiveBpm: number;
  /** The session clock — see the same prop on TimelineWindow. */
  scoreClockRef: MutableRefObject<ScoreClock | null>;
  /** Where the next Play begins — see the same prop on TimelineWindow. */
  getResumeBeat?: () => number;
  sourceBpm: number;
  offsetMs: number;
  /** Places the playhead — see the same prop on TimelineWindow. */
  tempoMap: RecordingTempoMap;
  /**
   * Where the tab starts and ends inside the recording.
   *
   * A five-minute video against forty bars of tab is the normal case, and
   * without this the map gives no clue which part of it you are working on.
   */
  tabSpanSec?: readonly [number, number] | null;
  /** Seconds of each pinned bar, so a long song shows where work has been done. */
  anchorSecs?: readonly number[];
  windowSec: number;
  centreSecOverride: number | null;
  /**
   * Bumped whenever the peaks' *contents* changed.
   *
   * A decoded file arrives complete, but a learned one fills in over a play-
   * through without its length ever changing — and length is what the cached
   * bitmap below was keyed on, so the map froze at whatever the first publish
   * happened to contain and never showed another thing being learned.
   */
  revision?: number;
  /** Click or drag anywhere to bring that part of the track into the detail lane. */
  onScrub: (sec: number) => void;
  heightPx?: number;
  className?: string;
}

/**
 * The whole recording at a glance — a map of where its loud parts are, with a
 * box showing what the detail lane below is looking at.
 *
 * Alignment usually needs a specific moment: the first downbeat, where the drums
 * come in, the start of a chorus. Finding those by scrolling a zoomed-in lane is
 * tedious; on the overview they are visible as shapes and one click away.
 */
export function AlignmentOverview({
  peaks,
  peaksPerSecond,
  durationSec,
  startTime,
  effectiveBpm,
  scoreClockRef,
  getResumeBeat,
  sourceBpm,
  offsetMs,
  tempoMap,
  tabSpanSec,
  anchorSecs,
  windowSec,
  centreSecOverride,
  revision = 0,
  onScrub,
  heightPx = 56,
  className,
}: AlignmentOverviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizeRef = useCanvasSize(canvasRef, heightPx);
  const isDraggingRef = useRef(false);
  /**
   * The waveform, painted once and then stamped.
   *
   * Redrawing it meant walking the whole peaks buffer — tens of thousands of
   * entries — on every animation frame, for a picture that only changes when the
   * recording or the canvas size does. That was the screen's single biggest cost.
   */
  const waveRef = useRef<{ canvas: HTMLCanvasElement; key: string } | null>(
    null,
  );
  /** Signature of the last frame drawn, so an idle screen stops repainting. */
  const lastFrameKeyRef = useRef("");

  const paramsRef = useRef({
    peaks,
    peaksPerSecond,
    durationSec,
    startTime,
    effectiveBpm,
    scoreClockRef,
    getResumeBeat,
    sourceBpm,
    offsetMs,
    tempoMap,
    tabSpanSec,
    anchorSecs,
    windowSec,
    centreSecOverride,
    revision,
    heightPx,
  });
  useEffect(() => {
    paramsRef.current = {
      peaks,
      peaksPerSecond,
      durationSec,
      startTime,
      effectiveBpm,
      scoreClockRef,
      getResumeBeat,
      sourceBpm,
      offsetMs,
      tempoMap,
      tabSpanSec,
      anchorSecs,
      windowSec,
      centreSecOverride,
      revision,
      heightPx,
    };
  });

  useTimelineFrame(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = ctxRef.current ?? (ctxRef.current = canvas.getContext("2d"));
    if (!ctx) return;

    const p = paramsRef.current;
    const { width, devicePixelRatio: dpr } = sizeRef.current;
    const height = p.heightPx;
    if (width === 0 || p.durationSec <= 0) return;
    const secondsPerPixel = p.durationSec / width;
    const midY = height / 2;

    const beats = sessionBeats(
      Date.now(),
      p.startTime,
      p.effectiveBpm,
      p.scoreClockRef.current,
      p.getResumeBeat,
    );
    const playheadSec = p.tempoMap.secForBeat(beats);
    const centreSec = p.centreSecOverride ?? playheadSec;

    // Nothing here animates on its own; if none of it moved, the last frame
    // is still correct and repainting it is pure waste.
    const frameKey = [
      width,
      height,
      p.durationSec,
      p.windowSec,
      // See AlignmentGrid: quantised to drawn pixels, so a still map stays still.
      Math.round(playheadSec / secondsPerPixel),
      Math.round(centreSec / secondsPerPixel),
      p.anchorSecs?.length ?? 0,
      p.tabSpanSec?.[0] ?? -1,
      p.tabSpanSec?.[1] ?? -1,
      p.revision,
    ].join("|");
    if (frameKey === lastFrameKeyRef.current) return;
    lastFrameKeyRef.current = frameKey;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // ── Whole-track waveform, off a cached bitmap ─────────────────────────
    if (p.peaks && p.peaks.length > 0) {
      const key = `${p.peaks.length}|${p.revision}|${width}|${height}|${dpr}|${p.durationSec}`;
      if (waveRef.current?.key !== key) {
        const off = waveRef.current?.canvas ?? document.createElement("canvas");
        off.width = Math.round(width * dpr);
        off.height = Math.round(height * dpr);
        const offCtx = off.getContext("2d");
        if (offCtx) {
          offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
          offCtx.clearRect(0, 0, width, height);
          offCtx.fillStyle = TIMELINE_COLORS.waveMap;
          offCtx.beginPath();
          for (let x = 0; x < width; x += 1) {
            // One pixel spans many buckets at this zoom — take the loudest, so
            // a single sharp hit never disappears between columns.
            const from = Math.floor(x * secondsPerPixel * p.peaksPerSecond);
            const to = Math.min(
              Math.floor((x + 1) * secondsPerPixel * p.peaksPerSecond),
              p.peaks.length,
            );
            let peak = 0;
            for (let i = from; i < to; i += 1) {
              if (p.peaks[i] > peak) peak = p.peaks[i];
            }
            const amplitude = peak * (midY - 3);
            offCtx.rect(x, midY - amplitude, 1, amplitude * 2);
          }
          offCtx.fill();
          waveRef.current = { canvas: off, key };
        }
      }
      if (waveRef.current)
        ctx.drawImage(waveRef.current.canvas, 0, 0, width, height);
    }

    // ── How much of the recording the tab actually covers ─────────────────
    if (p.tabSpanSec) {
      const from = Math.max(0, p.tabSpanSec[0] / secondsPerPixel);
      const to = Math.min(width, p.tabSpanSec[1] / secondsPerPixel);
      if (to > from) {
        ctx.fillStyle = TIMELINE_COLORS.tabSpan;
        ctx.fillRect(from, 0, to - from, height);
        ctx.fillStyle = TIMELINE_COLORS.tabSpanEdge;
        ctx.fillRect(from, height - 2, to - from, 2);
      }
    }

    // ── Bars that have been pinned, so the work done is visible at a glance ─
    if (p.anchorSecs?.length) {
      ctx.fillStyle = TIMELINE_COLORS.anchor;
      for (const sec of p.anchorSecs) {
        const x = sec / secondsPerPixel;
        if (x < -2 || x > width + 2) continue;
        ctx.fillRect(Math.round(x) - 1, 0, 2, 6);
      }
    }

    // ── Viewport box ──────────────────────────────────────────────────────
    const boxLeft = Math.max(
      0,
      (centreSec - p.windowSec / 2) / secondsPerPixel,
    );
    const boxRight = Math.min(
      width,
      (centreSec + p.windowSec / 2) / secondsPerPixel,
    );
    if (boxRight > boxLeft) {
      // Neutral, not cyan: where you are looking is not a fact about the
      // music, and painted cyan the box read as a second tab span sliding
      // around on top of the real one.
      ctx.fillStyle = TIMELINE_COLORS.viewportFill;
      ctx.fillRect(boxLeft, 0, boxRight - boxLeft, height);
      ctx.strokeStyle = TIMELINE_COLORS.viewport;
      ctx.lineWidth = 1;
      ctx.strokeRect(boxLeft + 0.5, 0.5, boxRight - boxLeft - 1, height - 1);
    }

    // ── Playhead ──────────────────────────────────────────────────────────
    const playheadX = playheadSec / secondsPerPixel;
    if (playheadX >= 0 && playheadX <= width) {
      ctx.strokeStyle = TIMELINE_COLORS.playhead;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(playheadX) + 0.5, 0);
      ctx.lineTo(Math.round(playheadX) + 0.5, height);
      ctx.stroke();
    }
  });

  const scrubTo = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const ratio = Math.min(
      1,
      Math.max(0, (event.clientX - rect.left) / rect.width),
    );
    onScrub(ratio * paramsRef.current.durationSec);
  };

  return (
    <canvas
      ref={canvasRef}
      aria-label='Backing track overview — click to jump to a part of the recording'
      style={{ height: heightPx }}
      className={cn(
        "w-full cursor-pointer touch-none rounded-lg bg-zinc-950/70",
        className,
      )}
      onPointerDown={(event) => {
        isDraggingRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        scrubTo(event);
      }}
      onPointerMove={(event) => {
        if (isDraggingRef.current) scrubTo(event);
      }}
      onPointerUp={(event) => {
        isDraggingRef.current = false;
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        isDraggingRef.current = false;
      }}
    />
  );
}
