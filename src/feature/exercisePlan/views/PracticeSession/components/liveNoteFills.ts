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
  /** A step after the hit has come in: the note is being held, not just struck. */
  held: boolean;
  /** The note earned its whole length and the fill is closing to its end. */
  closing: boolean;
  /** The beat the fill is drawn to (see liveFillDrawnBeat) and the audio time it was drawn at. */
  drawnBeat: number;
  drawnSec: number | null;
  // Kept here for the board, which draws the fill: how wide it last drew it,
  // how brightly its leading spark burns (0–1), and the wall ms the fill
  // reached the note's end (null until then).
  drawnW: number;
  spark: number;
  doneAt: number | null;
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
/**
 * How long a hold is carried on at the music's pace after its last step. Pitch
 * detection drops a frame now and then on a note that is ringing fine; the fill
 * used to stop dead for each one and then jump on. A note really let go of
 * ends this much further on, less than the eye can place.
 */
export const HOLD_CARRY_SEC = 0.08;
/** How many times the music's pace a fill that fell behind catches up at —
 *  it runs to where it should be instead of appearing there. */
const CATCH_UP_PACE = 2.5;
/** How long a completed note's fill takes to close to its end, eased out. */
export const COMPLETE_SEC = 0.18;
/** Share of the way it has closed a third of the way through. */
const COMPLETE_EASE_MID = 0.7;

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
      fill = {
        tile, samples: [], shownBeat: step.beat, hitAt: step.hit ? wallNow : null, timing: step.timing ?? null,
        held: false, closing: false, drawnBeat: step.beat, drawnSec: null, drawnW: 0, spark: 0, doneAt: null,
      };
      fills.byKey.set(step.noteKey, fill);
      if (step.hit) hits.push(step);
    }
    const last = fill.samples[fill.samples.length - 1];
    if (!step.hit) fill.held = true;
    if (step.complete && !step.hit) {
      fill.closing = true;
      // The note earned its whole length: close the fill from where it is to
      // the end over COMPLETE_SEC, easing out — a jump, but one the eye follows.
      const from = last ? last.beat : fill.shownBeat;
      const at = Math.max(step.audioSec, last ? last.audioSec : step.audioSec);
      fill.samples.push(
        { audioSec: at + COMPLETE_SEC / 3, beat: from + (step.beat - from) * COMPLETE_EASE_MID },
        { audioSec: at + COMPLETE_SEC, beat: step.beat },
      );
    } else if (last && step.audioSec <= last.audioSec) {
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

/**
 * The beat a fill is drawn to at audio time `renderSec`, on a board whose music
 * moves `beatsPerSec` there: where the steps put it (liveFillBeat), carried on
 * across a short gap in them, and never by a jump — a fill that fell behind
 * runs to catch up. Closing to the note's end keeps its own eased pace.
 */
export function liveFillDrawnBeat(fill: LiveFill, renderSec: number | null, beatsPerSec: number): number {
  let target = liveFillBeat(fill, renderSec);
  if (renderSec === null || !(beatsPerSec > 0)) {
    fill.drawnBeat = Math.max(fill.drawnBeat, target);
    fill.drawnSec = renderSec;
    return fill.drawnBeat;
  }
  const last = fill.samples[fill.samples.length - 1];
  if (fill.held && !fill.closing && last && renderSec > last.audioSec) {
    target = Math.max(target, last.beat + Math.min(renderSec - last.audioSec, HOLD_CARRY_SEC) * beatsPerSec);
  }
  if (fill.closing || fill.drawnSec === null) {
    fill.drawnBeat = Math.max(fill.drawnBeat, target);
  } else {
    const reach = fill.drawnBeat + Math.max(0, renderSec - fill.drawnSec) * beatsPerSec * CATCH_UP_PACE;
    fill.drawnBeat = Math.max(fill.drawnBeat, Math.min(target, reach));
  }
  fill.drawnSec = renderSec;
  return fill.drawnBeat;
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
