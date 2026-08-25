import { cn } from "assets/lib/utils";
import { useEffect, useMemo, useRef } from "react";

import { useCanvasSize, useTimelineFrame } from "../hooks/useTimelineFrame";
import type { TabNoteEvent, TabSourceMeasure } from "../utils/alignment";
import { beatGridLines, tabNoteEvents } from "../utils/alignment";
import { sessionBeats } from "../utils/backingSync";
import { TIMELINE_COLORS } from "../utils/timelineColors";
import type { TimelineWindow } from "./TimelineRuler";

const STRING_COUNT = 6;

/** String 1 is the high E, drawn on top, the way tablature is always written. */
const STRING_LABELS = ["e", "B", "G", "D", "A", "E"];

/** Width of the pinned string-name gutter, in CSS px. */
const GUTTER_PX = 20;

/** A note shorter than this still has to be visible, so blocks never shrink past it. */
const MIN_BLOCK_PX = 3;

/** Gap between one block and the next, so a run of notes reads as separate hits. */
const BLOCK_GAP_PX = 1;

/** Below this much room inside a block the digit is dropped, not squeezed. */
const MIN_LABEL_PX = 4;

/** Corner rounding, matching the 4px the style guide gives small elements. */
const BLOCK_RADIUS = 3;

/** Thickness of the brighter edge marking where the note is struck. */
const ATTACK_PX = 2;

const NOTE_FONT = "600 11px ui-monospace, SFMono-Regular, Menlo, monospace";
const LABEL_FONT = "600 9px ui-monospace, SFMono-Regular, Menlo, monospace";

/** The lane's own background, painted behind a fret number to break the string. */
const LANE_BG = "rgb(21, 21, 24)";

interface TabLaneProps extends TimelineWindow {
  /** The exercise's tablature, in the session's own measure format. */
  measures?: TabSourceMeasure[];
  heightPx: number;
  /**
   * Plays from the beat that was clicked.
   *
   * The tab is the thing you are lining the recording up against, so it is also
   * the most natural place to say "start here" — reaching for a transport at the
   * bottom of the screen to audition one bar is a detour.
   */
  onSeekToBeat?: (beat: number) => void;
  className?: string;
}

/**
 * The tab as real tablature on the same time axis as the waveforms.
 *
 * Bar numbers alone make you count; the shape of the riff doesn't. Seeing the
 * notes next to the recording's transients is what makes "these two line up" a
 * judgement you can make at a glance — and that only works if the lane shows
 * what is actually played. Six rails of identical dots, which is what this used
 * to draw, say almost nothing.
 *
 * Each note is a block on its own string, carrying its fret. Blocks rather than
 * marks so length is visible too: a whole note and a sixteenth look like what
 * they are, and the block's left edge — drawn brighter — is the attack you
 * actually line up against the waveform. Because the block is measured through
 * the tempo map, a bar the band dragged through comes out wider, exactly as it
 * sounds.
 *
 * Zoomed far out a block gets too narrow for its digit, so the digit is dropped
 * while the block stays. Nothing disappears; it just says less.
 */
export function TabLane({
  measures,
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
  heightPx,
  onSeekToBeat,
  className,
}: TabLaneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizeRef = useCanvasSize(canvasRef, heightPx);
  /** Fret digits are drawn hundreds of times a frame and there are only a few
   *  dozen of them, so their widths are measured once rather than per note. */
  const labelWidthRef = useRef(new Map<string, number>());
  /** Window the last frame drew, so a click maps to what is on screen. */
  const viewRef = useRef({ startSec: 0, secondsPerPixel: 0.004 });
  const events = useMemo<TabNoteEvent[]>(() => tabNoteEvents(measures), [measures]);
  /** Longest note in the piece, in beats. An event can only reach into the
   *  window from behind by its own length, so this is how far back the search
   *  for the first visible note has to start. */
  const maxEventBeats = useMemo(
    () => events.reduce((longest, event) => Math.max(longest, event.durationBeats), 0),
    [events],
  );
  /** Signature of the last frame drawn, so an idle lane stops repainting. */
  const lastFrameKeyRef = useRef("");

  const paramsRef = useRef({
    events, maxEventBeats, startTime, effectiveBpm, scoreClockRef, getResumeBeat, sourceBpm,
    offsetMs, tempoMap, beatsPerBar, windowSec, centreSecOverride, heightPx,
  });
  useEffect(() => {
    paramsRef.current = {
      events, maxEventBeats, startTime, effectiveBpm, scoreClockRef, getResumeBeat, sourceBpm,
      offsetMs, tempoMap, beatsPerBar, windowSec, centreSecOverride, heightPx,
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

    // Walking every note of the tab sixty times a second for a picture that
    // has not moved is the kind of cost that shows up as stutter elsewhere.
    const frameKey = [
      width, height, p.windowSec, p.offsetMs, p.beatsPerBar,
      // Quantised to the pixel each value lands on rather than to a slice of a
      // second. Five milliseconds is finer than a frame, so the old key changed
      // on literally every frame and the early-out never once fired — a parked
      // lane redrew itself sixty times a second to show the same picture.
      Math.round(windowStart / secondsPerPixel), Math.round(playheadSec / secondsPerPixel),
      p.events.length, p.tempoMap.points.length,
    ].join("|");
    if (frameKey === lastFrameKeyRef.current) return;
    lastFrameKeyRef.current = frameKey;

    // Clearing before deciding whether to draw is what makes a skipped frame
    // show as a blank one — the wipe has to wait until the frame is committed to.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // ── String rails ──────────────────────────────────────────────────────
    // Padded enough that the outer strings' digits aren't clipped by the lane.
    const pad = 11;
    const rail = (height - pad * 2) / (STRING_COUNT - 1);
    const railY = (stringNumber: number) =>
      pad + (Math.min(STRING_COUNT, Math.max(1, stringNumber)) - 1) * rail;

    ctx.strokeStyle = TIMELINE_COLORS.string;
    ctx.lineWidth = 1;
    for (let i = 0; i < STRING_COUNT; i += 1) {
      const y = Math.round(pad + i * rail) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // ── Bar lines, so the tab reads against the same grid ─────────────────
    const lines = beatGridLines({
      windowStartSec: windowStart,
      windowEndSec: windowEnd,
      sourceBpm: p.sourceBpm,
      offsetMs: p.offsetMs,
      beatsPerBar: p.beatsPerBar,
      tempoMap: p.tempoMap,
      secondsPerPixel,
    });

    // Zinc, like every other bar line on the screen. Drawn cyan they were the
    // same colour as the notes standing on them, which is the one contrast this
    // lane exists to show.
    ctx.strokeStyle = TIMELINE_COLORS.barLineFaint;
    ctx.beginPath();
    for (const line of lines) {
      if (!line.isBarStart) continue;
      const x = Math.round((line.sec - windowStart) / secondsPerPixel) + 0.5;
      ctx.moveTo(x, pad);
      ctx.lineTo(x, height - pad);
    }
    ctx.stroke();

    // ── Notes ─────────────────────────────────────────────────────────────
    ctx.font = NOTE_FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Short enough to leave the string visible above and below, so the block
    // reads as sitting on its string rather than replacing it.
    const blockH = Math.min(18, rail * 0.74);

    // Only the notes that can be on screen. Walking a five-minute song's worth
    // of events sixty times a second to draw the two bars in view is most of
    // what this lane used to cost — and the list is in beat order, so the first
    // one that can reach the window is a binary search away.
    const firstBeat = p.tempoMap.beatForSec(windowStart - 1) - p.maxEventBeats;
    const lastBeat = p.tempoMap.beatForSec(windowEnd + 1);
    let lo = 0;
    let hi = p.events.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (p.events[mid].beat < firstBeat) lo = mid + 1;
      else hi = mid;
    }

    for (let i = lo; i < p.events.length; i += 1) {
      const event = p.events[i];
      if (event.beat > lastBeat) break;
      const startSec = p.tempoMap.secForBeat(event.beat);
      const endSec = p.tempoMap.secForBeat(event.beat + event.durationBeats);
      if (endSec < windowStart - 1 || startSec > windowEnd + 1) continue;

      const x0 = (startSec - windowStart) / secondsPerPixel;
      const x1 = (endSec - windowStart) / secondsPerPixel;
      const w = Math.max(MIN_BLOCK_PX, x1 - x0 - BLOCK_GAP_PX);
      if (x1 < -40 || x0 > width + 40) continue;

      for (const note of event.notes) {
        const y = railY(note.string);
        const top = y - blockH / 2;

        ctx.fillStyle = TIMELINE_COLORS.tabBlock;
        if (typeof ctx.roundRect === "function") {
          ctx.beginPath();
          ctx.roundRect(x0, top, w, blockH, BLOCK_RADIUS);
          ctx.fill();
        } else {
          ctx.fillRect(x0, top, w, blockH);
        }

        // The struck edge. Alignment is judged against this, not the middle of
        // the note, so it is the one part drawn at full strength.
        ctx.fillStyle = TIMELINE_COLORS.tab;
        ctx.fillRect(x0, top, Math.min(ATTACK_PX, w), blockH);

        const label = String(note.fret);
        let labelWidth = labelWidthRef.current.get(label);
        if (labelWidth === undefined) {
          labelWidth = ctx.measureText(label).width;
          labelWidthRef.current.set(label, labelWidth);
        }
        if (w - ATTACK_PX >= labelWidth + MIN_LABEL_PX) {
          ctx.fillStyle = TIMELINE_COLORS.tabLabel;
          ctx.fillText(label, x0 + (w + ATTACK_PX) / 2, y + 0.5);
        }
      }
    }

    // ── String names, pinned so they never scroll off ─────────────────────
    const gutter = ctx.createLinearGradient(0, 0, GUTTER_PX + 8, 0);
    gutter.addColorStop(0, LANE_BG);
    gutter.addColorStop(0.7, LANE_BG);
    gutter.addColorStop(1, "rgba(21, 21, 24, 0)");
    ctx.fillStyle = gutter;
    ctx.fillRect(0, 0, GUTTER_PX + 8, height);

    ctx.font = LABEL_FONT;
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(161, 161, 170, 0.9)";
    for (let i = 0; i < STRING_COUNT; i += 1) {
      ctx.fillText(STRING_LABELS[i], 5, pad + i * rail + 0.5);
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
      ctx.lineWidth = 1;
    }
  });

  return (
    <canvas
      ref={canvasRef}
      aria-label={
        onSeekToBeat
          ? "Tablature notes on the alignment timeline — click to play from there"
          : "Tablature notes on the alignment timeline"
      }
      onPointerDown={
        onSeekToBeat
          ? (event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const { startSec, secondsPerPixel } = viewRef.current;
              const sec = startSec + (event.clientX - rect.left) * secondsPerPixel;
              onSeekToBeat(tempoMap.beatForSec(sec));
            }
          : undefined
      }
      style={{ height: heightPx }}
      className={cn(
        "w-full rounded-lg bg-zinc-900/60",
        onSeekToBeat && "cursor-pointer",
        className,
      )}
    />
  );
}
