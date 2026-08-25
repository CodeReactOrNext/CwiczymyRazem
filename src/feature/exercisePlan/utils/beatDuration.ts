import type {
  TablatureBeat,
  TablatureMeasure,
} from "feature/exercisePlan/types/exercise.types";

/** Triplet grids give durations of 1/3, which never sum to an exact integer. */
const EPSILON = 1e-6;

/**
 * Note values the editor writes, longest first, in quarter notes — everything a
 * plain or dotted power-of-two note can express between a whole note and a
 * thirty-second. Used to cut a leftover gap into rests that are actually
 * notatable, instead of leaving a 1.25-quarter beat nothing can draw.
 */
export const NOTATABLE_DURATIONS = [
  4, 3, 2, 1.5, 1, 0.75, 0.5, 0.375, 0.25, 0.1875, 0.125,
] as const;

/** A rest can't be longer than this before it's split — a whole note. */
const MAX_REST_PARTS = 16;

/**
 * Splits `total` quarter notes into rests that can be drawn. Values that don't
 * decompose (a leftover third of a beat from a triplet grid, say) are returned
 * whole rather than approximated — a single odd rest keeps the measure's length
 * exact, which is what the completeness check and the preview both rely on.
 */
export function splitIntoNotatableDurations(total: number): number[] {
  if (total <= EPSILON) return [];

  const parts: number[] = [];
  let left = total;

  while (left > EPSILON && parts.length < MAX_REST_PARTS) {
    const part = NOTATABLE_DURATIONS.find((value) => value <= left + EPSILON);
    if (part === undefined) return [total];
    parts.push(part);
    left -= part;
  }

  return left > EPSILON ? [total] : parts;
}

const restBeat = (duration: number): TablatureBeat => ({ notes: [], duration });

/**
 * Rewrites one beat's duration while keeping the measure exactly as long as it
 * was — the invariant that lets a bar hold notes longer than one grid step.
 *
 * Growing a beat swallows the steps after it (a half note *is* the following
 * beats), so their notes go with them; growth stops at the bar line, since a
 * note that ran past it would need a tie the model can't express. Shrinking
 * leaves a gap, which comes back as rests.
 */
function resizeBeatAt(
  beats: TablatureBeat[],
  beatIdx: number,
  duration: number,
): TablatureBeat[] {
  const beat = beats[beatIdx];
  if (!beat) return beats;

  const delta = duration - beat.duration;
  if (Math.abs(delta) < EPSILON) return beats;

  const next = [...beats];

  if (delta < 0) {
    next[beatIdx] = { ...beat, duration };
    next.splice(
      beatIdx + 1,
      0,
      ...splitIntoNotatableDurations(-delta).map(restBeat),
    );
    return next;
  }

  let needed = delta;
  while (needed > EPSILON && beatIdx + 1 < next.length) {
    const following = next[beatIdx + 1];
    if (following.duration <= needed + EPSILON) {
      needed -= following.duration;
      next.splice(beatIdx + 1, 1);
    } else {
      next[beatIdx + 1] = {
        ...following,
        duration: following.duration - needed,
      };
      needed = 0;
    }
  }

  next[beatIdx] = { ...beat, duration: duration - needed };
  return next;
}

/**
 * Applies `duration` to every beat of `measure` listed in `beatIndices`,
 * left to right, keeping the bar's total length untouched.
 *
 * Indices refer to the measure as it is now: a beat that an earlier (longer)
 * neighbour has already swallowed is simply gone, so it's skipped rather than
 * re-created — turning sixteen sixteenths into quarter notes leaves four
 * quarters, not four quarters plus twelve orphans.
 */
export function setBeatsDuration(
  measure: TablatureMeasure,
  beatIndices: number[],
  duration: number,
): TablatureMeasure {
  if (beatIndices.length === 0 || duration <= 0) return measure;

  // Tagged so a beat stays findable after the ones around it move.
  const tagged = measure.beats.map((beat, beatIdx) => ({
    beat,
    selected: beatIndices.includes(beatIdx),
  }));

  let beats: TablatureBeat[] = tagged.map((entry) => entry.beat);
  const selected = new Set(
    tagged.filter((entry) => entry.selected).map((entry) => entry.beat),
  );

  for (let i = 0; i < beats.length; i++) {
    if (!selected.has(beats[i])) continue;
    beats = resizeBeatAt(beats, i, duration);
  }

  return { ...measure, beats };
}

/** Strips the notes from `beatIndices`, turning those beats into rests. */
export function restBeatsAt(
  measure: TablatureMeasure,
  beatIndices: number[],
): TablatureMeasure {
  const wanted = new Set(beatIndices);
  return {
    ...measure,
    beats: measure.beats.map((beat, beatIdx) =>
      wanted.has(beatIdx) && beat.notes.length > 0
        ? { ...beat, notes: [] }
        : beat,
    ),
  };
}

/** Start of each beat inside its measure, in quarter notes. */
export function beatOffsetsInQuarters(beats: TablatureBeat[]): number[] {
  let offset = 0;
  return beats.map((beat) => {
    const start = offset;
    offset += beat.duration;
    return start;
  });
}

/**
 * True when a beat starts on one of the measure's counted beats (the "1, 2, 3,
 * 4" of a 4/4 bar) — where tab draws a separator. Derived from the offset
 * rather than the step index, so it still lands right in a bar whose beats have
 * different lengths.
 */
export function startsCountedBeat(
  offsetInQuarters: number,
  timeSignature: [number, number],
): boolean {
  const unit = 4 / timeSignature[1];
  const steps = offsetInQuarters / unit;
  return Math.abs(steps - Math.round(steps)) < 1e-3;
}
