import {
  getSkillLevel,
  getSkillLevelProgress,
  getSkillLevels,
  skillLevelStart,
} from "feature/skills/utils/skillLevel";
import { describe, expect, it } from "vitest";

describe("skillLevelStart", () => {
  it("needs 5 more points for each level than for the one before", () => {
    expect([1, 2, 3, 4, 5, 6].map(skillLevelStart)).toEqual([
      0, 5, 15, 30, 50, 75,
    ]);
  });
});

describe("getSkillLevelProgress", () => {
  it("starts a skill with no points at level 1, five points from level 2", () => {
    expect(getSkillLevelProgress(0)).toEqual({
      level: 1,
      progress: 0,
      nextAt: 5,
      toNext: 5,
    });
  });

  it("reaches a level exactly at its threshold", () => {
    const result = getSkillLevelProgress(30);

    expect(result.level).toBe(4);
    expect(result.progress).toBe(0);
    expect(result.nextAt).toBe(50);
  });

  it("measures progress within the current level, not from zero", () => {
    // Level 4 runs from 30 to 50 points — 37 is 7 of those 20.
    const result = getSkillLevelProgress(37);

    expect(result.level).toBe(4);
    expect(result.progress).toBeCloseTo(7 / 20);
    expect(result.toNext).toBe(13);
  });

  it("treats negative points as none", () => {
    expect(getSkillLevel(-4)).toBe(1);
  });
});

describe("getSkillLevels", () => {
  it("maps points to levels and leaves untouched skills out", () => {
    expect(
      getSkillLevels({ alternate_picking: 37, legato: 14, tapping: 0 }),
    ).toEqual({ alternate_picking: 4, legato: 2 });
  });

  it("is empty without data", () => {
    expect(getSkillLevels(undefined)).toEqual({});
  });
});
