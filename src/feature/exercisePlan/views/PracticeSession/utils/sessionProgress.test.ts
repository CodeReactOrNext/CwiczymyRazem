import { describe, expect, it } from "vitest";

import { getExerciseFill } from "./sessionProgress";

describe("getExerciseFill", () => {
  it("is empty before any time went in and full at the exercise's length", () => {
    expect(getExerciseFill({ timeInMinutes: 2 }, 0, false)).toBe(0);
    expect(getExerciseFill({ timeInMinutes: 2 }, 30_000, true)).toBe(25);
    expect(getExerciseFill({ timeInMinutes: 2 }, 300_000, true)).toBe(100);
  });

  it("goes by whether it was practised when the exercise has no length", () => {
    expect(getExerciseFill({ timeInMinutes: 0 }, 40_000, false)).toBe(0);
    expect(getExerciseFill({ timeInMinutes: 0 }, 40_000, true)).toBe(100);
  });
});
