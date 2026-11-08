import { FEATURE_GOALS_PER_CASE } from "feature/whatNext/data/featureGoals";
import { describe, expect, it } from "vitest";

import {
  featureGoalBaseline,
  featureGoalCases,
  featureGoalCasesPayable,
  NEW_ACCOUNT_SESSIONS,
} from "./featureGoalCases";

const goals = (count: number) =>
  Array.from({ length: count }, (_, index) => `g${index}`);

describe("featureGoalBaseline", () => {
  it("counts nothing as done before for a new account", () => {
    expect(featureGoalBaseline(["a", "b"], NEW_ACCOUNT_SESSIONS - 1)).toEqual(
      [],
    );
  });

  it("keeps what a settled account had already done", () => {
    expect(featureGoalBaseline(["a", "b"], NEW_ACCOUNT_SESSIONS)).toEqual([
      "a",
      "b",
    ]);
  });
});

describe("featureGoalCases", () => {
  it("pays one case for every five goals done since the baseline", () => {
    expect(FEATURE_GOALS_PER_CASE).toBe(5);
    const cases = featureGoalCases(goals(11), [], 0);
    expect(cases).toMatchObject({ counted: 11, earned: 2, owed: 2, toNext: 4 });
  });

  it("leaves goals done before the baseline out", () => {
    const cases = featureGoalCases(goals(7), goals(4), 0);
    expect(cases).toMatchObject({ counted: 3, earned: 0, owed: 0, toNext: 2 });
  });

  it("owes only what has not been collected", () => {
    expect(featureGoalCases(goals(10), [], 2).owed).toBe(0);
    expect(featureGoalCases(goals(10), [], 1).owed).toBe(1);
  });

  it("asks for a full five again right after a case", () => {
    expect(featureGoalCases(goals(5), [], 1).toNext).toBe(5);
  });
});

describe("featureGoalCasesPayable", () => {
  it("pays one case a day, however many are owed", () => {
    expect(featureGoalCasesPayable(3, null, "2026-11-08")).toBe(1);
    expect(featureGoalCasesPayable(3, "2026-11-07", "2026-11-08")).toBe(1);
  });

  it("pays nothing more on a day one was already paid", () => {
    expect(featureGoalCasesPayable(2, "2026-11-08", "2026-11-08")).toBe(0);
  });

  it("pays nothing when nothing is owed", () => {
    expect(featureGoalCasesPayable(0, null, "2026-11-08")).toBe(0);
  });
});
