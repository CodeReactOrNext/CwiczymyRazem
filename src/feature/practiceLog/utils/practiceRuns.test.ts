import { describe, expect, it } from "vitest";

import { getNextStreakMilestone, getRunEdges } from "./practiceRuns";

const days = (dates: Date[]) =>
  dates.map((date) => date.getDate()).sort((a, b) => a - b);

describe("getRunEdges", () => {
  it("joins days practised back to back", () => {
    const edges = getRunEdges([
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-07",
    ]);
    expect(days(edges.start)).toEqual([3]);
    expect(days(edges.middle)).toEqual([4]);
    expect(days(edges.end)).toEqual([5]);
    expect(days(edges.single)).toEqual([7]);
  });

  it("cuts the ribbon between Sunday and Monday", () => {
    const edges = getRunEdges(["2026-11-21", "2026-11-22", "2026-11-23"]);
    expect(days(edges.start)).toEqual([21]);
    expect(days(edges.end)).toEqual([22]);
    expect(days(edges.single)).toEqual([23]);
  });
});

describe("getNextStreakMilestone", () => {
  const now = new Date(2026, 10, 24, 20);

  it("counts on from today once today is played", () => {
    expect(getNextStreakMilestone(3, true, now)).toEqual({
      days: 7,
      date: new Date(2026, 10, 28),
    });
  });

  it("lets today count when it is still to come", () => {
    expect(getNextStreakMilestone(3, false, now)?.date).toEqual(
      new Date(2026, 10, 27),
    );
  });

  it("looks past a milestone already reached", () => {
    expect(getNextStreakMilestone(7, true, now)?.days).toBe(30);
  });

  it("has nothing to flag without a streak or past the last milestone", () => {
    expect(getNextStreakMilestone(0, false, now)).toBeNull();
    expect(getNextStreakMilestone(400, true, now)).toBeNull();
  });
});
