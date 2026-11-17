import { describe, expect, it } from "vitest";

import { earTrainingBoardScore } from "./earTrainingBoardScore";

describe("earTrainingBoardScore", () => {
  it("is zero without a single mic-verified melody", () => {
    expect(earTrainingBoardScore([], 0, 180_000)).toBe(0);
  });

  it("counts every verified melody solved within the limit", () => {
    expect(earTrainingBoardScore([10_000, 50_000, 179_000], 0, 180_000)).toBe(3);
  });

  it("drops melodies solved after one attempt would have ended", () => {
    expect(earTrainingBoardScore([10_000, 170_000, 200_000, 900_000], 0, 180_000)).toBe(2);
  });

  it("measures from the run's start, not from the page's clock origin", () => {
    expect(earTrainingBoardScore([1_010_000, 1_170_000, 1_200_000], 1_000_000, 180_000)).toBe(2);
  });

  it("falls back to the first verified melody when the start was never marked", () => {
    expect(earTrainingBoardScore([5_000, 100_000, 190_000], null, 180_000)).toBe(2);
  });

  it("counts everything when the exercise has no fixed time", () => {
    expect(earTrainingBoardScore([0, 1_000_000], 0, null)).toBe(2);
  });
});
