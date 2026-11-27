import { accuracyToStars } from "feature/journey/utils/examStars";
import { describe, expect, it } from "vitest";

import { intervalClickExamAccuracy, intervalClickExamMinRounds } from "./clickExamGrade";

describe("intervalClickExamMinRounds", () => {
  it("asks for two thirds of the 10-second rounds the exam has time for", () => {
    expect(intervalClickExamMinRounds(2)).toBe(8);
    expect(intervalClickExamMinRounds(3)).toBe(12);
    expect(intervalClickExamMinRounds(4)).toBe(16);
  });
});

describe("intervalClickExamAccuracy", () => {
  it("passes a run with a heart left and enough rounds, whatever its click rate", () => {
    // Ten rounds and one wrong click: 20 of 21 clicks. Two wrong: 20 of 22 = 91%.
    expect(accuracyToStars(intervalClickExamAccuracy(91, 10, 8))).toBe(1);
    expect(accuracyToStars(intervalClickExamAccuracy(80, 8, 8))).toBe(1);
  });

  it("leaves the higher stars to the click rate", () => {
    expect(intervalClickExamAccuracy(98, 12, 8)).toBe(98);
    expect(accuracyToStars(intervalClickExamAccuracy(100, 12, 8))).toBe(3);
  });

  it("fails a run short of the rounds, however clean", () => {
    expect(accuracyToStars(intervalClickExamAccuracy(100, 7, 8))).toBeNull();
    expect(intervalClickExamAccuracy(100, 4, 8)).toBe(50);
    expect(intervalClickExamAccuracy(100, 0, 8)).toBe(0);
  });
});
