/**
 * Maths for lining a recording up with the tab by eye or by ear.
 *
 * Two ways to do it, and they need different information:
 *  - **By eye** — draw the recording's waveform with the tab's beats on top and
 *    drag until the transients sit on the lines. Only possible for a local file,
 *    where the samples are ours to read.
 *  - **By ear** — tap along with what you hear; each tap says "this is where a
 *    beat of the recording actually landed", and the error against the nearest
 *    tab beat is the correction. Works for anything that makes sound, which is
 *    the only option for a YouTube video.
 *
 * Everything here is pure so both paths can be tested without audio.
 */

import { beatsSinceStart } from "./backingSync";
import type { RecordingTempoMap } from "./tempoMap";

export function secondsPerBeat(sourceBpm: number): number {
  if (!Number.isFinite(sourceBpm) || sourceBpm <= 0) return 0.5;
  return 60 / sourceBpm;
}

/**
 * How far a tap missed the nearest tab beat, in wall-clock ms.
 * Positive = the recording's beat arrived late.
 *
 * Returns null when the session isn't running, since there is no beat to miss.
 */
export function tapErrorMs(
  tapMs: number,
  startTime: number | null,
  effectiveBpm: number,
): number | null {
  if (startTime === null || !Number.isFinite(effectiveBpm) || effectiveBpm <= 0) return null;

  const beats = beatsSinceStart(tapMs, startTime, effectiveBpm);
  const msPerBeat = 60_000 / effectiveBpm;
  const nearestBeatMs = startTime + Math.round(beats) * msPerBeat;
  return tapMs - nearestBeatMs;
}

/**
 * Fraction of a beat a tap may be off and still be unambiguous.
 *
 * Measuring against the *nearest* beat already bounds the error at half a beat,
 * so a half-beat threshold would accept everything. What actually needs
 * rejecting is a tap near that boundary: it is equally close to two beats, so
 * acting on it is as likely to shove the recording half a beat the wrong way as
 * to fix it. Those taps are dropped and the player told to try again.
 */
const AMBIGUOUS_TAP_FRACTION = 0.4;

export function isUsableTap(errorMs: number, effectiveBpm: number): boolean {
  if (!Number.isFinite(errorMs) || !Number.isFinite(effectiveBpm) || effectiveBpm <= 0) return false;
  return Math.abs(errorMs) < (60_000 / effectiveBpm) * AMBIGUOUS_TAP_FRACTION;
}

/** Median, so one badly-timed tap in a handful can't move the result. */
export function medianMs(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

/**
 * The offset that puts the tapped beats on the tab's beats.
 *
 * The error is wall-clock, but the offset lives in the recording's own timeline,
 * so it has to be converted at the rate the recording is being read — otherwise
 * the correction is wrong by exactly the tempo ratio.
 */
export function offsetFromTaps(params: {
  errorsMs: number[];
  currentOffsetMs: number;
  effectiveBpm: number;
  sourceBpm: number;
}): number {
  const { errorsMs, currentOffsetMs, effectiveBpm, sourceBpm } = params;
  if (errorsMs.length === 0) return currentOffsetMs;

  const rate =
    Number.isFinite(effectiveBpm) && Number.isFinite(sourceBpm) && sourceBpm > 0
      ? effectiveBpm / sourceBpm
      : 1;

  // A beat that arrived late is fixed by starting the recording further in.
  return currentOffsetMs + medianMs(errorsMs) * rate;
}

export interface BeatLine {
  /** Position in the recording's own seconds. */
  sec: number;
  /** Beats since the tab's beat 0. Negative before the tab starts. */
  index: number;
  /** First beat of a bar — drawn heavier and carries the bar number. */
  isBarStart: boolean;
  /** 1-based bar number, or null for beats before the tab begins. */
  bar: number | null;
}

/** Guard against a pathological window asking for a million lines. */
const MAX_GRID_LINES = 2000;

/**
 * Closest two lines may sit before the grid stops being a grid.
 *
 * Zoomed out to a whole song, one line per beat is several hundred strokes a
 * frame per lane for a picture that is a solid grey smear — neighbouring lines
 * land nearer to each other than a line is wide. Thinning them out is what the
 * picture wants anyway, and since every lane rebuilds this list sixty times a
 * second it is also the difference between a screen that keeps up and one that
 * does not.
 */
const MIN_LINE_GAP_PX = 5;

/**
 * Beats between drawn lines: every beat while they are still readable, then
 * every bar, then every second, fourth, eighth… bar as the view opens out.
 *
 * Stepping in multiples of the meter keeps every drawn line a bar start, so a
 * thinned grid never leaves a bar number standing on a line that isn't there.
 */
function gridStepBeats(params: {
  secPerBeat: number;
  secondsPerPixel?: number;
  beatsPerBar: number;
}): number {
  const { secPerBeat, secondsPerPixel, beatsPerBar } = params;
  if (!secondsPerPixel || secondsPerPixel <= 0 || secPerBeat <= 0) return 1;

  const beatGapPx = secPerBeat / secondsPerPixel;
  if (beatGapPx >= MIN_LINE_GAP_PX) return 1;

  let step = beatsPerBar;
  while (beatGapPx * step < MIN_LINE_GAP_PX && step < MAX_GRID_LINES) step *= 2;
  return step;
}

/**
 * Every tab beat inside a window, with enough about each to draw a DAW-style
 * ruler: spacing comes from the recording's tempo, phase from the offset, and
 * bar boundaries from the metronome's own meter.
 *
 * Pass `tempoMap` for a recording whose bars have been pinned by hand — the
 * spacing then varies across the window, bunching up where the band pushed and
 * opening out where it dragged, which is the whole point of anchoring bars.
 *
 * Pass `secondsPerPixel` — the zoom it is being drawn at — and the grid thins
 * itself out instead of handing back lines that cannot be told apart.
 */
export function beatGridLines(params: {
  windowStartSec: number;
  windowEndSec: number;
  sourceBpm: number;
  offsetMs: number;
  beatsPerBar?: number;
  /** Bends the grid to a recording that drifts. Omit for an even grid. */
  tempoMap?: RecordingTempoMap;
  /** Zoom, so lines too close together to see are never built in the first
   *  place. Omitted, every beat in the window comes back. */
  secondsPerPixel?: number;
}): BeatLine[] {
  const { windowStartSec, windowEndSec, sourceBpm, offsetMs, tempoMap, secondsPerPixel } =
    params;
  const beatsPerBar = Math.max(1, Math.round(params.beatsPerBar ?? 4));
  if (windowEndSec <= windowStartSec) return [];

  const lineAt = (sec: number, index: number): BeatLine => ({
    sec,
    index,
    isBarStart: index >= 0 && index % beatsPerBar === 0,
    bar: index >= 0 ? Math.floor(index / beatsPerBar) + 1 : null,
  });

  if (tempoMap && !tempoMap.isConstant) {
    const firstBeat = tempoMap.beatForSec(windowStartSec);
    // The map bends across the window, so there is no single beat length to
    // measure density against — what the eye sees is the window's average.
    const beatsInWindow = Math.max(
      1e-6,
      tempoMap.beatForSec(windowEndSec) - firstBeat,
    );
    const step = gridStepBeats({
      secPerBeat: (windowEndSec - windowStartSec) / beatsInWindow,
      secondsPerPixel,
      beatsPerBar,
    });
    const firstIndex = Math.ceil(firstBeat / step) * step;
    const lines: BeatLine[] = [];
    for (let index = firstIndex; lines.length < MAX_GRID_LINES; index += step) {
      const sec = tempoMap.secForBeat(index);
      if (sec > windowEndSec) break;
      lines.push(lineAt(sec, index));
    }
    return lines;
  }

  const spacing = secondsPerBeat(sourceBpm);
  if (spacing <= 0) return [];
  const step = gridStepBeats({ secPerBeat: spacing, secondsPerPixel, beatsPerBar });
  if ((windowEndSec - windowStartSec) / (spacing * step) > MAX_GRID_LINES) return [];

  const phase = offsetMs / 1000;
  const firstIndex = Math.ceil((windowStartSec - phase) / spacing / step) * step;
  const lines: BeatLine[] = [];
  for (let index = firstIndex; ; index += step) {
    const sec = phase + index * spacing;
    if (sec > windowEndSec) break;
    lines.push(lineAt(sec, index));
  }
  return lines;
}

/**
 * How often a drag on the timeline is handed to React, in ms.
 *
 * Every write re-renders the practice session that owns the alignment, so one
 * per pointer event spent a whole frame's budget re-rendering a session nobody
 * can see behind the editor — which is what made dragging in there stutter.
 * Twenty a second is still four times finer than the sync loop that acts on the
 * result (200 ms), and the lanes paint the frames in between from the live
 * gesture, so the hand feels no throttle at all.
 */
export const DRAG_COMMIT_MS = 50;

/**
 * How far a drag moves an offset, in ms. Dragging right pulls the clip later,
 * which means showing earlier audio at the playhead — hence the negative sign.
 *
 * A delta rather than a finished value on purpose: the same lane widget edits
 * the whole recording's offset in one place and a single stem's in another, and
 * handing it "the current value" invited applying one offset to the other.
 */
export function offsetDeltaFromDrag(params: {
  dragPx: number;
  secondsPerPixel: number;
}): number {
  const { dragPx, secondsPerPixel } = params;
  if (!Number.isFinite(dragPx) || !Number.isFinite(secondsPerPixel)) return 0;
  return -dragPx * secondsPerPixel * 1000;
}

/**
 * First moment the recording rises clearly above its own noise floor — where a
 * count-in, a stick click or the first chord begins. Used by "snap to start",
 * which gets most files close enough that only a nudge is left.
 *
 * `peaks` are normalised 0..1 magnitudes, one per bucket.
 */
export function firstOnsetIndex(peaks: number[], threshold = 0.12): number | null {
  if (peaks.length === 0) return null;

  const loudest = peaks.reduce((max, p) => (p > max ? p : max), 0);
  if (loudest <= 0) return null;

  const floor = loudest * threshold;
  for (let i = 0; i < peaks.length; i += 1) {
    if (peaks[i] >= floor) return i;
  }
  return null;
}

/**
 * The tablature this feature reads, as a structural subset of TablatureMeasure.
 *
 * Structural on purpose: the backing track knows nothing about exercises, and
 * shouldn't have to import their types to draw a lane. It does need the fret
 * though — a tab lane that only knows *which string* can draw dots and nothing
 * more, which is what it used to do.
 */
export interface TabSourceMeasure {
  beats: {
    notes: {
      string: number;
      fret: number;
      /** GM key number. Only drum tracks carry one, and it is what they mean. */
      midiNote?: number;
    }[];
    duration: number;
  }[];
}

/**
 * Quarter notes in a bar of this tab.
 *
 * The grid used to take this from the metronome's accent pattern, which
 * defaults to four and is only ever changed by hand — so every song not in 4/4
 * was drawn against a 4/4 grid, with bar lines in the wrong places and bar
 * numbers to match. The tab already knows: a measure's beat durations sum to
 * its length, which is the answer for 3/4 and 6/8 alike without needing to read
 * a time signature the structural type does not carry.
 *
 * The most common length rather than the first, so a pickup bar cannot set the
 * meter for the whole song. A tab that genuinely changes meter part-way still
 * gets one number — the grid has no way to say otherwise — but it gets the one
 * that is right for most of the piece instead of one that is right for none.
 */
export function barBeatsOf(
  measures: TabSourceMeasure[] | undefined,
  fallback: number,
): number {
  if (!measures?.length) return fallback;

  const tally = new Map<number, number>();
  for (const measure of measures) {
    const beats = (measure.beats ?? []).reduce(
      (sum, slot) => sum + (Number.isFinite(slot.duration) && slot.duration > 0 ? slot.duration : 1),
      0,
    );
    // Only whole numbers of quarter notes can be a bar length here: the grid
    // marks bar starts by counting beats, so 7/8 has no representation either
    // way and rounding it would put lines where nothing happens.
    const rounded = Math.round(beats);
    if (rounded < 1) continue;
    tally.set(rounded, (tally.get(rounded) ?? 0) + 1);
  }

  let best = fallback;
  let bestCount = 0;
  for (const [beats, count] of tally) {
    if (count > bestCount) {
      best = beats;
      bestCount = count;
    }
  }
  return bestCount > 0 ? best : fallback;
}

/** One note of the tablature, placed on the timeline. */
export interface TabNote {
  /** 1 = high E … 6 = low E. */
  string: number;
  fret: number;
  /** GM key number for a drum hit; absent on pitched tracks. */
  midiNote?: number;
}

export interface TabNoteEvent {
  /** Beats since the tab's beat 0. */
  beat: number;
  /** How long the beat slot lasts, in quarter notes. */
  durationBeats: number;
  /** Everything sounding at that moment, frets included. */
  notes: TabNote[];
}

/**
 * Flattens the tablature into "at beat N, these notes sound".
 *
 * The alignment screen draws these as real tablature on the same time axis as
 * the waveforms, so the shape of the riff can be matched against the shape of
 * the recording by eye — far easier than counting bars.
 *
 * `duration` is in quarter notes (1 = quarter, 0.5 = eighth), the same unit the
 * beat grid uses, so positions accumulate directly.
 */
export function tabNoteEvents(measures: TabSourceMeasure[] | undefined): TabNoteEvent[] {
  if (!measures?.length) return [];

  const events: TabNoteEvent[] = [];
  let beat = 0;
  for (const measure of measures) {
    for (const slot of measure.beats ?? []) {
      const durationBeats =
        Number.isFinite(slot.duration) && slot.duration > 0 ? slot.duration : 1;
      if (slot.notes?.length) {
        events.push({
          beat,
          durationBeats,
          notes: slot.notes.map((note) => ({
            string: note.string,
            // A missing fret is an open string, not a reason to drop the note.
            fret: Number.isFinite(note.fret) ? note.fret : 0,
            ...(typeof note.midiNote === "number" ? { midiNote: note.midiNote } : {}),
          })),
        });
      }
      beat += durationBeats;
    }
  }
  return events;
}

/**
 * Fraction of the local peak a rise must clear to count as an attack. Low
 * enough to catch a soft downbeat, high enough that the wobble inside a
 * sustained chord doesn't pull a bar line off the note that started it.
 */
const ONSET_RISE_FRACTION = 0.15;

/**
 * The transient nearest `sec`, or null when nothing in reach looks like one.
 *
 * Dragging a bar line onto a downbeat by eye is pixel-hunting at any useful
 * zoom, so the line gets pulled to where the recording actually strikes. What
 * counts is a sharp *rise* in level rather than simply a loud moment: a bar line
 * belongs at the attack of a note, not somewhere in the middle of a chord that
 * is still ringing.
 *
 * Returning null rather than a best guess is deliberate — over a sustain or a
 * silence there is no attack to snap to, and moving the line somewhere arbitrary
 * would be worse than leaving it where it was dropped.
 */
export function snapSecToTransient(params: {
  sec: number;
  peaks: Float32Array | readonly number[] | null;
  peaksPerSecond: number;
  toleranceSec: number;
}): number | null {
  const { sec, peaks, peaksPerSecond, toleranceSec } = params;
  if (!peaks || peaks.length === 0) return null;
  if (!Number.isFinite(sec) || !(peaksPerSecond > 0) || !(toleranceSec > 0)) return null;

  const first = Math.max(1, Math.ceil((sec - toleranceSec) * peaksPerSecond));
  const last = Math.min(peaks.length - 1, Math.floor((sec + toleranceSec) * peaksPerSecond));
  if (last < first) return null;

  let loudest = 0;
  for (let i = first; i <= last; i += 1) {
    if (peaks[i] > loudest) loudest = peaks[i];
  }
  if (loudest <= 0) return null;

  const minRise = loudest * ONSET_RISE_FRACTION;
  let bestIndex = -1;
  let bestRise = 0;
  for (let i = first; i <= last; i += 1) {
    const rise = peaks[i] - peaks[i - 1];
    if (rise < minRise || rise <= bestRise) continue;
    bestRise = rise;
    bestIndex = i;
  }

  return bestIndex < 0 ? null : bestIndex / peaksPerSecond;
}
