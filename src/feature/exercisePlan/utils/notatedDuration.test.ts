import { describe, expect, it } from "vitest";

import { flagCountForCode, inferTuplet, resolveNotatedDuration } from "./notatedDuration";

describe("resolveNotatedDuration", () => {
  it("keeps plain values", () => {
    expect(resolveNotatedDuration(1)).toEqual({ code: 4, dots: 0, tuplet: undefined });
    expect(resolveNotatedDuration(0.25)).toEqual({ code: 16, dots: 0, tuplet: undefined });
  });

  it("splits dotted values into base + dots", () => {
    expect(resolveNotatedDuration(0.75)).toEqual({ code: 8, dots: 1, tuplet: undefined });
    expect(resolveNotatedDuration(1.5)).toEqual({ code: 4, dots: 1, tuplet: undefined });
    expect(resolveNotatedDuration(3)).toEqual({ code: 2, dots: 1, tuplet: undefined });
    expect(resolveNotatedDuration(1.75)).toEqual({ code: 4, dots: 2, tuplet: undefined });
  });

  it("writes a declared triplet eighth as an eighth", () => {
    expect(resolveNotatedDuration(1 / 3, 3)).toEqual({ code: 8, dots: 0, tuplet: 3 });
  });

  it("infers the triplet of a bare, rounded triplet length", () => {
    expect(resolveNotatedDuration(0.333)).toEqual({ code: 8, dots: 0, tuplet: 3 });
    expect(resolveNotatedDuration(2 / 3)).toEqual({ code: 4, dots: 0, tuplet: 3 });
    expect(resolveNotatedDuration(1 / 6)).toEqual({ code: 16, dots: 0, tuplet: 3 });
  });
});

describe("inferTuplet", () => {
  it("leaves plain and dotted values alone", () => {
    for (const d of [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.375, 0.25, 0.125]) expect(inferTuplet(d)).toBeUndefined();
  });

  it("spots triplet lengths", () => {
    for (const d of [0.333, 1 / 3, 2 / 3, 1 / 6, 1 / 12, 4 / 3]) expect(inferTuplet(d)).toBe(3);
  });
});

describe("flagCountForCode", () => {
  it("maps note values to flags", () => {
    expect([4, 8, 16, 32, 64].map(flagCountForCode)).toEqual([0, 1, 2, 3, 3]);
  });
});
