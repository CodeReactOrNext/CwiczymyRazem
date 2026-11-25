import { describe, expect, it } from "vitest";

import type { ProgressData } from "./milestoneLogic";
import { LEVELS, openingMilestoneIndex } from "./milestoneLogic";

const NOTHING: ProgressData = {
  daysIn7With15: 0,
  daysIn7With20: 0,
  streak15: 0,
  allCatsThisWeek: 0,
  daysIn7AllCats: 0,
  streakAllCats: 0,
};
/** Meets Spark (1), Groove (2) and Hot Streak (3). */
const THREE_DAYS: ProgressData = {
  ...NOTHING,
  daysIn7With15: 3,
  daysIn7With20: 3,
  streak15: 3,
};
const FULL_WEEK: ProgressData = {
  daysIn7With15: 7,
  daysIn7With20: 7,
  streak15: 7,
  allCatsThisWeek: 4,
  daysIn7AllCats: 7,
  streakAllCats: 7,
};

const opensOn = (progress: ProgressData, owned: number[], claimed: number[]) =>
  LEVELS[openingMilestoneIndex(progress, new Set(owned), new Set(claimed))].id;

describe("openingMilestoneIndex", () => {
  it("opens on the first reward waiting to be collected", () => {
    expect(opensOn(THREE_DAYS, [1, 2, 3], [])).toBe(1);
    expect(opensOn(THREE_DAYS, [1, 2, 3], [1])).toBe(2);
    expect(opensOn(THREE_DAYS, [1, 2, 3], [1, 2])).toBe(3);
  });

  it("finds a reward past a goal not met yet", () => {
    // Three 15-minute days: Groove (20 min) is open, Hot Streak already pays.
    expect(opensOn({ ...THREE_DAYS, daysIn7With20: 0 }, [1, 2, 3], [1])).toBe(3);
  });

  it("moves on to the next goal once everything is collected", () => {
    expect(opensOn(THREE_DAYS, [1, 2, 3], [1, 2, 3])).toBe(4);
    expect(opensOn(NOTHING, [1], [])).toBe(1);
  });

  it("skips a met goal whose tier was never unlocked", () => {
    expect(opensOn(THREE_DAYS, [1], [1])).toBe(4);
  });

  it("rests on the last tier when the whole ladder is done", () => {
    const all = LEVELS.map((level) => level.id);
    expect(opensOn(FULL_WEEK, all, all)).toBe(LEVELS.length);
  });
});
