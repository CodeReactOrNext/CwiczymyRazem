import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import {
  alternatePickStrokes,
  clearPickStroke,
  pickStrokeOfRefs,
  togglePickStroke,
} from "./pickStrokes";
import type { BeatRef } from "./tabSelection";

const measure = (
  beats: { fret?: number; pickStroke?: "down" | "up" }[],
): TablatureMeasure => ({
  timeSignature: [4, 4],
  beats: beats.map((b) => ({
    duration: 0.25,
    notes: b.fret === undefined ? [] : [{ string: 1, fret: b.fret }],
    ...(b.pickStroke ? { pickStroke: b.pickStroke } : {}),
  })),
});

/** Beats `from`…`to` of one measure, in playing order. */
const refs = (measureIdx: number, from: number, to: number): BeatRef[] =>
  Array.from({ length: to - from + 1 }, (_, i) => ({
    measureIdx,
    beatIdx: from + i,
  }));

describe("togglePickStroke", () => {
  it("marks every beat in the range", () => {
    const measures = [measure([{ fret: 0 }, { fret: 1 }, { fret: 2 }])];

    const next = togglePickStroke(measures, refs(0, 0, 1), "down");

    expect(next[0].beats.map((b) => b.pickStroke)).toEqual([
      "down",
      "down",
      undefined,
    ]);
  });

  it("clears the range when it already carries that direction", () => {
    const measures = [
      measure([
        { fret: 0, pickStroke: "up" },
        { fret: 1, pickStroke: "up" },
      ]),
    ];

    const next = togglePickStroke(measures, refs(0, 0, 1), "up");

    expect(next[0].beats.every((b) => "pickStroke" in b)).toBe(false);
  });

  it("marks the whole range when only part of it carries the direction", () => {
    const measures = [measure([{ fret: 0, pickStroke: "down" }, { fret: 1 }])];

    const next = togglePickStroke(measures, refs(0, 0, 1), "down");

    expect(next[0].beats.map((b) => b.pickStroke)).toEqual(["down", "down"]);
  });

  it("marks beats across a bar line in one go", () => {
    const measures = [
      measure([{ fret: 0 }, { fret: 1 }]),
      measure([{ fret: 2 }, { fret: 3 }]),
    ];

    const next = togglePickStroke(
      measures,
      [...refs(0, 1, 1), ...refs(1, 0, 0)],
      "up",
    );

    expect(next[0].beats.map((b) => b.pickStroke)).toEqual([undefined, "up"]);
    expect(next[1].beats.map((b) => b.pickStroke)).toEqual(["up", undefined]);
  });

  it("leaves untouched measures identity-equal", () => {
    const measures = [measure([{ fret: 0 }]), measure([{ fret: 1 }])];

    const next = togglePickStroke(measures, refs(1, 0, 0), "down");

    expect(next[0]).toBe(measures[0]);
    expect(next[1]).not.toBe(measures[1]);
  });
});

describe("alternatePickStrokes", () => {
  it("alternates down/up across the notes, skipping rests", () => {
    const measures = [
      measure([{ fret: 0 }, {}, { fret: 1 }, { fret: 2 }, { fret: 3 }]),
    ];

    const next = alternatePickStrokes(measures, refs(0, 0, 4));

    expect(next[0].beats.map((b) => b.pickStroke)).toEqual([
      "down",
      undefined,
      "up",
      "down",
      "up",
    ]);
  });

  it("keeps alternating over the bar line", () => {
    const measures = [
      measure([{ fret: 0 }, { fret: 1 }, { fret: 2 }]),
      measure([{ fret: 3 }, { fret: 4 }]),
    ];

    const next = alternatePickStrokes(measures, [
      ...refs(0, 0, 2),
      ...refs(1, 0, 1),
    ]);

    expect(next[0].beats.map((b) => b.pickStroke)).toEqual([
      "down",
      "up",
      "down",
    ]);
    expect(next[1].beats.map((b) => b.pickStroke)).toEqual(["up", "down"]);
  });

  it("only touches the selected range", () => {
    const measures = [measure([{ fret: 0 }, { fret: 1 }, { fret: 2 }])];

    const next = alternatePickStrokes(measures, refs(0, 1, 2));

    expect(next[0].beats.map((b) => b.pickStroke)).toEqual([
      undefined,
      "down",
      "up",
    ]);
  });
});

describe("clearPickStroke", () => {
  it("drops the key instead of storing undefined", () => {
    const measures = [measure([{ fret: 0, pickStroke: "down" }])];

    const next = clearPickStroke(measures, refs(0, 0, 0));

    expect("pickStroke" in next[0].beats[0]).toBe(false);
  });
});

describe("pickStrokeOfRefs", () => {
  it("returns the shared direction, or null when the range disagrees", () => {
    const measures = [
      measure([
        { fret: 0, pickStroke: "down" },
        { fret: 1, pickStroke: "down" },
        { fret: 2, pickStroke: "up" },
      ]),
    ];

    expect(pickStrokeOfRefs(measures, refs(0, 0, 1))).toBe("down");
    expect(pickStrokeOfRefs(measures, refs(0, 0, 2))).toBeNull();
    expect(pickStrokeOfRefs(measures, [])).toBeNull();
  });
});
