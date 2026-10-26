// The green fill of hit notes as the matching loop reports it, step by step
// (FillStep in utils/fillFeed.ts) — kept by the tablature worker, apart from
// React's copy of the hits, so it can be unit tested without a Worker.
//
// Every step is stamped with the audio time it was judged at. The board draws
// the fill a little behind its clock, between the two steps around that moment,
// so the fill grows at the cursor's own pace however unevenly the steps arrive,
// and stops exactly where the note stopped ringing.
import type { FillStep } from "../utils/fillFeed";
import type { NoteTiming } from "../utils/timingGrade";

export interface LiveFill {
  /** Repetition of the tab (board tile) the note was played in — note keys
   *  repeat every pass, so a fill belongs to one tile only. */
  tile: number;
  /** Steps still needed to draw between, oldest first. */
  samples: { audioSec: number; beat: number }[];
  /** Furthest beat the fill has been drawn to — it never goes back. */
  shownBeat: number;
  /** Wall ms the hit arrived, for its flash; null for a fill picked up mid-hold. */
  hitAt: number | null;
  /** The hit's timing, ahead of React's copy of it. */
  timing: NoteTiming | null;
}

export interface LiveFills {
  byKey: Map<string, LiveFill>;
  /** How far behind the audio clock fills are drawn, in seconds. */
  delaySec: number;
}

/** A frame of the main thread — a step may wait that long to be sent. */
const STEP_INTERVAL_SEC = 1 / 60;
const MIN_DELAY_SEC = 0.025;
const MAX_DELAY_SEC = 0.12;
/** How fast the delay comes back down once steps arrive on time again. */
const DELAY_RELAX_SEC = 0.0002;
const MAX_SAMPLES = 64;

export const createLiveFills = (): LiveFills => ({ byKey: new Map(), delaySec: 0.05 });

export function clearLiveFills(fills: LiveFills): void {
  fills.byKey.clear();
}

/**
 * Takes in steps from the feed. `tileOf` places a step's beat on the board;
 * `audioNow` is the worker's audio clock when they arrived (null without one).
 * Returns the notes newly hit by them.
 */
export function addFillSteps(
  fills: LiveFills,
  steps: readonly FillStep[],
  tileOf: (beat: number) => number,
  wallNow: number,
  audioNow: number | null,
): FillStep[] {
  const hits: FillStep[] = [];
  for (const step of steps) {
    const tile = tileOf(step.beat);
    let fill = fills.byKey.get(step.noteKey);
    // A hit starts the note over — the same key comes back every pass.
    if (!fill || step.hit || fill.tile !== tile) {
      fill = { tile, samples: [], shownBeat: step.beat, hitAt: step.hit ? wallNow : null, timing: step.timing ?? null };
      fills.byKey.set(step.noteKey, fill);
      if (step.hit) hits.push(step);
    }
    const last = fill.samples[fill.samples.length - 1];
    if (last && step.audioSec <= last.audioSec) {
      // currentTime moves in audio callbacks, so two ticks can read the same one.
      last.beat = Math.max(last.beat, step.beat);
    } else {
      fill.samples.push({ audioSec: step.audioSec, beat: step.beat });
      if (fill.samples.length > MAX_SAMPLES) fill.samples.shift();
    }
    if (audioNow !== null) {
      // Far enough behind that the next step is usually in before it's needed.
      const needed = audioNow - step.audioSec + STEP_INTERVAL_SEC;
      fills.delaySec = Math.min(MAX_DELAY_SEC, Math.max(MIN_DELAY_SEC, needed, fills.delaySec - DELAY_RELAX_SEC));
    }
  }
  return hits;
}

/** The fill of `noteKey` if it was played on board tile `tile`. */
export function liveFillOn(fills: LiveFills, noteKey: string, tile: number): LiveFill | undefined {
  const fill = fills.byKey.get(noteKey);
  return fill && fill.tile === tile ? fill : undefined;
}

/**
 * The beat a fill is drawn to at audio time `renderSec` — where the steps
 * around it put the note then. Without a clock (paused) it shows all it got.
 */
export function liveFillBeat(fill: LiveFill, renderSec: number | null): number {
  const samples = fill.samples;
  let beat = fill.shownBeat;
  if (samples.length > 0) {
    if (renderSec === null) {
      beat = samples[samples.length - 1].beat;
    } else {
      // Done with every step before the last one at or before renderSec.
      let first = 0;
      while (first + 1 < samples.length && samples[first + 1].audioSec <= renderSec) first++;
      if (first > 0) samples.splice(0, first);
      const a = samples[0];
      const b = samples[1];
      beat = !b || renderSec <= a.audioSec
        ? a.beat
        : a.beat + (b.beat - a.beat) * (renderSec - a.audioSec) / (b.audioSec - a.audioSec);
    }
  }
  if (beat > fill.shownBeat) fill.shownBeat = beat;
  return fill.shownBeat;
}

const sameTiming = (a: NoteTiming, b: NoteTiming) =>
  a.grade === b.grade && a.hint === b.hint && a.offsetBeats === b.offsetBeats;

/**
 * The timing to show for a hit note: React's copy once it describes this very
 * hit (by then it may carry the intonation verdict too), the hit's own until
 * then — React's may still be the same note's from the pass before.
 */
export function currentTiming(fromReact: NoteTiming | undefined, fill: LiveFill | undefined): NoteTiming | undefined {
  if (!fill?.timing) return fromReact;
  return fromReact && sameTiming(fromReact, fill.timing) ? fromReact : fill.timing;
}

/** True when React's timing for a note is the one its live fill already showed. */
export const isLiveTiming = (fill: LiveFill | undefined, timing: NoteTiming): boolean =>
  !!fill?.timing && sameTiming(fill.timing, timing);
