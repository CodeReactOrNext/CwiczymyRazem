import { describe, expect, it } from "vitest";

import { isRecognizedPracticePlan, isRecognizedPracticePlanId } from "./isRecognizedPracticePlan";

const exercise = { id: "some_exercise" } as any;

describe("isRecognizedPracticePlanId", () => {
  it("recognizes a default plan id", () => {
    expect(isRecognizedPracticePlanId("spider_master_plan")).toBe(true);
  });

  it("recognizes an auto-generated plan id", () => {
    expect(isRecognizedPracticePlanId("auto_1234567890")).toBe(true);
  });

  it("does not recognize an ad-hoc single-exercise id", () => {
    expect(isRecognizedPracticePlanId("some_exercise")).toBe(false);
    expect(isRecognizedPracticePlanId("temp-some_exercise")).toBe(false);
    expect(isRecognizedPracticePlanId("exercise-some_exercise")).toBe(false);
  });
});

describe("isRecognizedPracticePlan", () => {
  it("counts any multi-exercise session as a real plan", () => {
    expect(
      isRecognizedPracticePlan({ id: "temp-anything", exercises: [exercise, exercise] })
    ).toBe(true);
  });

  it("does not count an ad-hoc single-exercise session (Skill Dashboard, Exercise Library, ...)", () => {
    expect(isRecognizedPracticePlan({ id: "some_exercise", exercises: [exercise] })).toBe(false);
    expect(isRecognizedPracticePlan({ id: "temp-some_exercise", exercises: [exercise] })).toBe(false);
  });

  it("counts a recognized single-exercise default plan", () => {
    expect(
      isRecognizedPracticePlan({ id: "musician_fitness_lvl1_s1", exercises: [exercise] })
    ).toBe(true);
  });
});
