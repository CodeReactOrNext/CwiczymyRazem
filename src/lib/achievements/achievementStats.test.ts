import type { AchievementList } from "feature/achievements/types";
import { describe, expect, it } from "vitest";

import type { AchievementStatsDoc } from "./achievementStats";
import {
  countsAsPlayer,
  MIN_SESSIONS_FOR_PLAYER,
  rateFromStats,
  tallyAchievementStats,
} from "./achievementStats";

const ids = (...list: string[]) => list as AchievementList[];

describe("tallyAchievementStats", () => {
  it("counts holders per badge and players in total", () => {
    const stats = tallyAchievementStats(
      [
        { sessionCount: 4, achievements: ids("time_1", "points_1") },
        { sessionCount: 3, achievements: ids("time_1") },
        { sessionCount: 9, achievements: ids() },
      ],
      1000
    );

    expect(stats).toEqual({
      counts: { time_1: 2, points_1: 1 },
      totalPlayers: 3,
      updatedAt: 1000,
    });
  });

  it("leaves accounts that barely played out of the denominator", () => {
    // Signed up and left: on real data these were most of the pool and put the
    // commonest badge in the game at 29.8%. See `MIN_SESSIONS_FOR_PLAYER`.
    const stats = tallyAchievementStats([
      { sessionCount: 8, achievements: ids("time_1") },
      { sessionCount: 1, achievements: ids() },
      { sessionCount: 0, achievements: ids() },
      { achievements: ids() },
    ]);

    expect(stats.totalPlayers).toBe(1);
  });

  it("does not let a duplicated id count one account twice", () => {
    const stats = tallyAchievementStats([
      { sessionCount: 5, achievements: ids("time_1", "time_1") },
    ]);

    expect(stats.counts.time_1).toBe(1);
  });
});

describe("countsAsPlayer", () => {
  it.each([
    [{ sessionCount: MIN_SESSIONS_FOR_PLAYER }, true],
    [{ sessionCount: MIN_SESSIONS_FOR_PLAYER + 10 }, true],
    [{ sessionCount: MIN_SESSIONS_FOR_PLAYER - 1 }, false],
    [{ sessionCount: 0 }, false],
    [{}, false],
    [undefined, false],
  ])("reads %o as %s", (statistics, expected) => {
    expect(countsAsPlayer(statistics)).toBe(expected);
  });
});

describe("rateFromStats", () => {
  const stats: AchievementStatsDoc = {
    counts: { time_1: 41, points_1: 3 },
    totalPlayers: 50,
    updatedAt: 0,
  };

  it("returns the share to one decimal", () => {
    expect(rateFromStats("time_1" as AchievementList, stats)).toBe(82);
    expect(rateFromStats("points_1" as AchievementList, stats)).toBe(6);
  });

  it("reads a badge nobody holds as zero, not unknown", () => {
    expect(rateFromStats("lvl100" as AchievementList, stats)).toBe(0);
  });

  it("returns null when there is nothing to divide by", () => {
    // The caller falls back to a placeholder: rendering 0.0% here would claim
    // nobody holds the badge, when the truth is that nothing has been counted.
    expect(rateFromStats("time_1" as AchievementList, null)).toBeNull();
    expect(rateFromStats("time_1" as AchievementList, { ...stats, totalPlayers: 0 })).toBeNull();
  });

  it("never exceeds 100% when the counter outruns a stale denominator", () => {
    expect(
      rateFromStats("time_1" as AchievementList, { ...stats, counts: { time_1: 80 } })
    ).toBe(100);
  });
});
