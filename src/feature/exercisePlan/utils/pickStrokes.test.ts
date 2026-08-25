import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import {
  alternatePickStrokes,
  clearPickStroke,
  pickStrokeOfRange,
  togglePickStroke,
} from "./pickStrokes";

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

describe("togglePickStroke", () => {
  it("marks every beat in the range", () => {
    const measures = [measure([{ fret: 0 }, { fret: 1 }, { fret: 2 }])];

    const next = togglePickStroke(
      measures,
      { measureIdx: 0, startBeat: 0, endBeat: 1 },
      "down",
    );

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

    const next = togglePickStroke(
      measures,
      { measureIdx: 0, startBeat: 0, endBeat: 1 },
      "up",
    );

    expect(next[0].beats.every((b) => "pickStroke" in b)).toBe(false);
  });

  it("marks the whole range when only part of it carries the direction", () => {
    const measures = [measure([{ fret: 0, pickStroke: "down" }, { fret: 1 }])];

    const next = togglePickStroke(
      measures,
      { measureIdx: 0, startBeat: 0, endBeat: 1 },
      "down",
    );

    expect(next[0].beats.map((b) => b.pickStroke)).toEqual(["down", "down"]);
  });

  it("leaves untouched measures identity-equal", () => {
    const measures = [measure([{ fret: 0 }]), measure([{ fret: 1 }])];

    const next = togglePickStroke(
      measures,
      { measureIdx: 1, startBeat: 0, endBeat: 0 },
      "down",
    );

    expect(next[0]).toBe(measures[0]);
    expect(next[1]).not.toBe(measures[1]);
  });
});

describe("alternatePickStrokes", () => {
  it("alternates down/up across the notes, skipping rests", () => {
    const measures = [
      measure([{ fret: 0 }, {}, { fret: 1 }, { fret: 2 }, { fret: 3 }]),
    ];

    const next = alternatePickStrokes(measures, {
      measureIdx: 0,
      startBeat: 0,
      endBeat: 4,
    });

    expect(next[0].beats.map((b) => b.pickStroke)).toEqual([
      "down",
      undefined,
      "up",
      "down",
      "up",
    ]);
  });

  it("only touches the selected range", () => {
    const measures = [measure([{ fret: 0 }, { fret: 1 }, { fret: 2 }])];

    const next = alternatePickStrokes(measures, {
      measureIdx: 0,
      startBeat: 1,
      endBeat: 2,
    });

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

    const next = clearPickStroke(measures, {
      measureIdx: 0,
      startBeat: 0,
      endBeat: 0,
    });

    expect("pickStroke" in next[0].beats[0]).toBe(false);
  });
});

describe("pickStrokeOfRange", () => {
  it("returns the shared direction, or null when the range disagrees", () => {
    const measures = [
      measure([
        { fret: 0, pickStroke: "down" },
        { fret: 1, pickStroke: "down" },
        { fret: 2, pickStroke: "up" },
      ]),
    ];

    expect(
      pickStrokeOfRange(measures, { measureIdx: 0, startBeat: 0, endBeat: 1 }),
    ).toBe("down");
    expect(
      pickStrokeOfRange(measures, { measureIdx: 0, startBeat: 0, endBeat: 2 }),
    ).toBeNull();
    expect(pickStrokeOfRange(measures, null)).toBeNull();
  });
});
