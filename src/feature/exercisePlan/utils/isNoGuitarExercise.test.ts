import { isNoGuitarExercise } from "feature/exercisePlan/utils/isNoGuitarExercise";
import { describe, expect, it } from "vitest";

describe("isNoGuitarExercise", () => {
  it("treats click-answered hunts as playable without a guitar", () => {
    expect(isNoGuitarExercise({ noteHuntConfig: { rotateSeconds: 20, mode: "click" } })).toBe(true);
    expect(isNoGuitarExercise({ noteHuntConfig: { rotateSeconds: 20, mode: "intervalClick" } })).toBe(true);
  });

  it("treats ear quizzes as playable without a guitar", () => {
    expect(isNoGuitarExercise({ earQuizConfig: { mode: "chordQuality" } as never })).toBe(true);
  });

  it("keeps mic-driven hunts and plain exercises in the guitar bucket", () => {
    expect(isNoGuitarExercise({ noteHuntConfig: { rotateSeconds: 20, mode: "octaves" } })).toBe(false);
    expect(isNoGuitarExercise({})).toBe(false);
  });

  it("lets an exercise override the derived answer", () => {
    expect(isNoGuitarExercise({ noGuitarNeeded: true })).toBe(true);
    expect(
      isNoGuitarExercise({ noGuitarNeeded: false, noteHuntConfig: { rotateSeconds: 20, mode: "click" } })
    ).toBe(false);
  });
});
