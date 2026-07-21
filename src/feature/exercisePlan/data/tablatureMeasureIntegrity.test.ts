import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { describe, expect, it } from "vitest";

// A measure's notated length (sum of `beat.duration`, in quarter-note units) must equal
// `numerator * (4 / denominator)` — its capacity under the declared time signature.
// tablatureToAlphaTex.ts turns each TablatureMeasure into one alphaTex bar (`\ts n d ... |`);
// AlphaTab has no concept of "this bar secretly holds two bars' worth of notes", so an
// over- or under-filled measure desyncs the rendered notation from the actual bar count as
// the piece progresses (see #741). The historically broken exercises were fixed by
// correcting their timeSignature to match the actual notated content (e.g. a measure with
// 16 eighth notes became one 8/4 bar) rather than by adding bars or padding rests — keep
// this test's capacity formula in sync with the one in tablatureToAlphaTex.ts.
const EPS = 1e-2;

describe("exercise tablature measure integrity", () => {
  const exercisesWithTablature = exercisesAgregat.filter(
    (exercise) => exercise.tablature && exercise.tablature.length > 0,
  );

  it.each(exercisesWithTablature.map((exercise) => [exercise.id, exercise] as const))(
    "%s — every measure's notated duration matches its time signature",
    (_id, exercise) => {
      const violations = exercise
        .tablature!.map((measure, index) => {
          const [numerator, denominator] = measure.timeSignature;
          const capacity = numerator * (4 / denominator);
          const total = measure.beats.reduce((sum, beat) => sum + beat.duration, 0);
          return { index, total, capacity, diff: total - capacity };
        })
        .filter((measure) => Math.abs(measure.diff) > EPS);

      if (violations.length > 0) {
        const details = violations
          .map(
            (v) =>
              `  measure #${v.index + 1}/${exercise.tablature!.length}: total=${v.total.toFixed(3)} vs capacity=${v.capacity} (${
                v.diff > 0 ? "overflow" : "underflow"
              } by ${Math.abs(v.diff).toFixed(3)})`,
          )
          .join("\n");
        throw new Error(
          `"${exercise.title}" (${exercise.id}) has measures that don't match their declared time signature:\n${details}`,
        );
      }

      expect(violations).toEqual([]);
    },
  );
});
