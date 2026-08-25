import type {
  PickStroke,
  TablatureBeat,
  TablatureMeasure,
} from "feature/exercisePlan/types/exercise.types";
import type { BeatRef } from "feature/exercisePlan/utils/tabSelection";

const refKey = (ref: BeatRef) => `${ref.measureIdx}:${ref.beatIdx}`;

/** The beats `refs` points at, in the order given, skipping ones that are gone. */
function beatsOf(
  measures: TablatureMeasure[],
  refs: BeatRef[],
): TablatureBeat[] {
  return refs
    .map((ref) => measures[ref.measureIdx]?.beats[ref.beatIdx])
    .filter((beat): beat is TablatureBeat => beat !== undefined);
}

/**
 * Writes the computed stroke onto every referenced beat, leaving every other
 * measure identity-equal so React only re-renders the bars that changed.
 */
function writeStrokes(
  measures: TablatureMeasure[],
  strokes: Map<string, PickStroke | undefined>,
): TablatureMeasure[] {
  if (strokes.size === 0) return measures;

  return measures.map((measure, measureIdx) => {
    let changed = false;

    const beats = measure.beats.map((beat, beatIdx) => {
      const key = refKey({ measureIdx, beatIdx });
      if (!strokes.has(key)) return beat;

      const pickStroke = strokes.get(key);
      if (pickStroke === beat.pickStroke) return beat;
      changed = true;
      // Dropped rather than set to undefined so exported tabs (and the draft in
      // localStorage) don't carry a key for every unmarked beat.
      const { pickStroke: _dropped, ...rest } = beat;
      return pickStroke ? { ...rest, pickStroke } : rest;
    });

    return changed ? { ...measure, beats } : measure;
  });
}

function strokeMap(
  refs: BeatRef[],
  next: (ref: BeatRef, index: number) => PickStroke | undefined,
): Map<string, PickStroke | undefined> {
  return new Map(refs.map((ref, index) => [refKey(ref), next(ref, index)]));
}

/**
 * Sets `stroke` on every beat in `refs`. Pressing the direction that's already
 * set on all of them clears it instead, so the same button/key both marks and
 * unmarks — the toggle behaviour the articulation buttons already have.
 */
export function togglePickStroke(
  measures: TablatureMeasure[],
  refs: BeatRef[],
  stroke: PickStroke,
): TablatureMeasure[] {
  const covered = beatsOf(measures, refs);
  const allMarked =
    covered.length > 0 && covered.every((beat) => beat.pickStroke === stroke);

  return writeStrokes(
    measures,
    strokeMap(refs, () => (allMarked ? undefined : stroke)),
  );
}

/** Removes the marking from every beat in `refs`. */
export function clearPickStroke(
  measures: TablatureMeasure[],
  refs: BeatRef[],
): TablatureMeasure[] {
  return writeStrokes(
    measures,
    strokeMap(refs, () => undefined),
  );
}

/**
 * Fills `refs` with strict alternate picking, starting on a downstroke.
 *
 * Only beats that actually carry notes are marked, and only those advance the
 * pattern — a rest in the middle of a run doesn't flip the hand, so the picking
 * keeps alternating across it (down, up, rest, down, up …).
 */
export function alternatePickStrokes(
  measures: TablatureMeasure[],
  refs: BeatRef[],
): TablatureMeasure[] {
  let played = 0;

  return writeStrokes(
    measures,
    strokeMap(refs, (ref) => {
      const beat = measures[ref.measureIdx]?.beats[ref.beatIdx];
      if (!beat || beat.notes.length === 0) return undefined;
      return played++ % 2 === 0 ? "down" : "up";
    }),
  );
}

/** The stroke shared by every beat in `refs`, or null when they disagree. */
export function pickStrokeOfRefs(
  measures: TablatureMeasure[],
  refs: BeatRef[],
): PickStroke | null {
  const covered = beatsOf(measures, refs);
  if (covered.length === 0) return null;

  const first = covered[0].pickStroke;
  return first && covered.every((beat) => beat.pickStroke === first)
    ? first
    : null;
}
