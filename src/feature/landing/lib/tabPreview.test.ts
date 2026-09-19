import { spiderBasicExercise } from "feature/exercisePlan/data/exerises/spiderBasic/spiderBasic";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import { getTabPreview, TAB_PREVIEW_LENGTH } from "./tabPreview";

const measure = (
  notes: Array<[number, number] | [number, number, "h"] | null>,
): TablatureMeasure => ({
  timeSignature: [4, 4],
  beats: notes.map((n) => ({
    duration: 0.25,
    notes: n
      ? [{ string: n[0], fret: n[1], ...(n[2] ? { isHammerOn: true } : {}) }]
      : [],
  })),
});

describe("getTabPreview", () => {
  it("returns nothing for exercises without tablature", () => {
    expect(getTabPreview(undefined)).toEqual([]);
    expect(getTabPreview([])).toEqual([]);
  });

  it("flattens measures and stops at the preview length", () => {
    const preview = getTabPreview(spiderBasicExercise.tablature);
    expect(preview).toHaveLength(TAB_PREVIEW_LENGTH);
    expect(preview[0]).toEqual({ string: 6, fret: 1 });
    // Second measure is reached only when the first one is shorter.
    const short = getTabPreview(
      [
        measure([
          [6, 1],
          [6, 2],
        ]),
        measure([[5, 3]]),
      ],
      16,
    );
    expect(short.map((n) => n.string)).toEqual([6, 6, 5]);
  });

  it("skips rests and marks slurred notes without emitting undefined", () => {
    const preview = getTabPreview([measure([[6, 1], null, [6, 2, "h"]])]);
    expect(preview).toEqual([
      { string: 6, fret: 1 },
      { string: 6, fret: 2, slur: true },
    ]);
    // getStaticProps rejects `undefined`, so the field must be absent, not unset.
    expect(Object.keys(preview[0])).toEqual(["string", "fret"]);
  });
});
