import { describe, expect, it } from "vitest";

import { accuracyToStars } from "./examStars";

describe("accuracyToStars", () => {
  it("grades on accuracy alone when timing isn't judged", () => {
    expect(accuracyToStars(92)).toBeNull();
    expect(accuracyToStars(93)).toBe(1);
    expect(accuracyToStars(96)).toBe(1);
    expect(accuracyToStars(97)).toBe(2);
    expect(accuracyToStars(98)).toBe(2);
    expect(accuracyToStars(99)).toBe(3);
    expect(accuracyToStars(100, null)).toBe(3);
  });

  it("never fails a run over its timing", () => {
    expect(accuracyToStars(93, 0)).toBe(1);
    expect(accuracyToStars(100, 0)).toBe(1);
  });

  it("holds the second and third star back until the timing is there", () => {
    expect(accuracyToStars(97, 89)).toBe(1);
    expect(accuracyToStars(97, 90)).toBe(2);
    expect(accuracyToStars(99, 94)).toBe(2);
    expect(accuracyToStars(99, 95)).toBe(3);
    expect(accuracyToStars(100, 89)).toBe(1);
  });

  it("doesn't let timing make up for missed notes", () => {
    expect(accuracyToStars(92, 100)).toBeNull();
    expect(accuracyToStars(96, 100)).toBe(1);
  });
});
