import { beforeEach, describe, expect, it } from "vitest";

import {
  EAR_QUIZ_EXAM_MIN_ANSWERS,
  earQuizExamAccuracy,
  earQuizExamMinAnswers,
  earQuizRunScore,
  useEarQuizRunStore,
} from "./earQuizRunStore";

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

describe("earQuizExamAccuracy", () => {
  it("is the hit rate once enough answers are in", () => {
    expect(earQuizExamAccuracy(14, 15)).toBe(93);
    expect(earQuizExamAccuracy(20, 20)).toBe(100);
  });

  it("grades the answers a short run never gave as wrong", () => {
    expect(earQuizExamAccuracy(1, 1)).toBe(100 / EAR_QUIZ_EXAM_MIN_ANSWERS);
    expect(earQuizExamAccuracy(0, 0)).toBe(0);
  });

  it("asks the tuning quiz for fewer answers than the naming ones", () => {
    expect(earQuizExamMinAnswers("detune")).toBeLessThan(earQuizExamMinAnswers("interval"));
    expect(earQuizExamAccuracy(4, 4, earQuizExamMinAnswers("detune"))).toBe(100);
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
