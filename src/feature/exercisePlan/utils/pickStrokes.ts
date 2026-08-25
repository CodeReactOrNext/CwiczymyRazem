import type {
  PickStroke,
  TablatureMeasure,
} from "feature/exercisePlan/types/exercise.types";

/** A run of beats inside one measure — a single cell selects a one-beat range. */
export interface PickStrokeRange {
  measureIdx: number;
  startBeat: number;
  endBeat: number;
}

const inRange = (index: number, range: PickStrokeRange) =>
  index >= Math.min(range.startBeat, range.endBeat) &&
  index <= Math.max(range.startBeat, range.endBeat);

/**
 * Rewrites the beats `range` covers, leaving every other measure identity-equal
 * so React only re-renders the bar that changed.
 */
function mapRange(
  measures: TablatureMeasure[],
  range: PickStrokeRange,
  next: (
    stroke: PickStroke | undefined,
    beatIdx: number,
  ) => PickStroke | undefined,
): TablatureMeasure[] {
  const measure = measures[range.measureIdx];
  if (!measure) return measures;

  return measures.map((m, mIdx) =>
    mIdx !== range.measureIdx
      ? m
      : {
          ...m,
          beats: m.beats.map((beat, bIdx) => {
            if (!inRange(bIdx, range)) return beat;
            const pickStroke = next(beat.pickStroke, bIdx);
            if (pickStroke === beat.pickStroke) return beat;
            // Dropped rather than set to undefined so exported tabs (and the
            // draft in localStorage) don't carry a key for every unmarked beat.
            const { pickStroke: _dropped, ...rest } = beat;
            return pickStroke ? { ...rest, pickStroke } : rest;
          }),
        },
  );
}

/**
 * Sets `stroke` on every beat in `range`. Pressing the direction that's already
 * set on all of them clears it instead, so the same button/key both marks and
 * unmarks — the toggle behaviour the articulation buttons already have.
 */
export function togglePickStroke(
  measures: TablatureMeasure[],
  range: PickStrokeRange,
  stroke: PickStroke,
): TablatureMeasure[] {
  const measure = measures[range.measureIdx];
  if (!measure) return measures;

  const covered = measure.beats.filter((_, bIdx) => inRange(bIdx, range));
  const allMarked =
    covered.length > 0 && covered.every((beat) => beat.pickStroke === stroke);

  return mapRange(measures, range, () => (allMarked ? undefined : stroke));
}

/** Removes the marking from every beat in `range`. */
export function clearPickStroke(
  measures: TablatureMeasure[],
  range: PickStrokeRange,
): TablatureMeasure[] {
  return mapRange(measures, range, () => undefined);
}

/**
 * Fills `range` with strict alternate picking, starting on a downstroke.
 *
 * Only beats that actually carry notes are marked, and only those advance the
 * pattern — a rest in the middle of a run doesn't flip the hand, so the picking
 * keeps alternating across it (down, up, rest, down, up …).
 */
export function alternatePickStrokes(
  measures: TablatureMeasure[],
  range: PickStrokeRange,
): TablatureMeasure[] {
  const measure = measures[range.measureIdx];
  if (!measure) return measures;

  let played = 0;
  return mapRange(measures, range, (_stroke, beatIdx) => {
    if (measure.beats[beatIdx].notes.length === 0) return undefined;
    return played++ % 2 === 0 ? "down" : "up";
  });
}

/** The stroke shared by every beat in `range`, or null when they disagree. */
export function pickStrokeOfRange(
  measures: TablatureMeasure[],
  range: PickStrokeRange | null,
): PickStroke | null {
  if (!range) return null;
  const covered = measures[range.measureIdx]?.beats.filter((_, bIdx) =>
    inRange(bIdx, range),
  );
  if (!covered || covered.length === 0) return null;
  const first = covered[0].pickStroke;
  return first && covered.every((beat) => beat.pickStroke === first)
    ? first
    : null;
}
