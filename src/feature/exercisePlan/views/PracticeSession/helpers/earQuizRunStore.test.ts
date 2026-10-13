import { beforeEach, describe, expect, it } from "vitest";

import { earQuizRunScore, useEarQuizRunStore } from "./earQuizRunStore";

describe("useEarQuizRunStore", () => {
  beforeEach(() => useEarQuizRunStore.getState().reset());

  it("counts answers and right answers until reset", () => {
    const { record } = useEarQuizRunStore.getState();
    record(true);
    record(false);
    record(true);
    expect(useEarQuizRunStore.getState()).toMatchObject({ correct: 2, answered: 3 });
    useEarQuizRunStore.getState().reset();
    expect(useEarQuizRunStore.getState()).toMatchObject({ correct: 0, answered: 0 });
  });
});

describe("earQuizRunScore", () => {
  it("pays right answers and charges wrong ones", () => {
    expect(earQuizRunScore(15, 16)).toBe(1400);
  });

  it("makes guessing fast worse than answering carefully", () => {
    expect(earQuizRunScore(40, 100)).toBeLessThan(earQuizRunScore(15, 16));
  });

  it("never goes below zero", () => {
    expect(earQuizRunScore(0, 5)).toBe(0);
  });
});
