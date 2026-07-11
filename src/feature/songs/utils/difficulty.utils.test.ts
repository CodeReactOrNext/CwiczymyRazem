import { describe, expect, it } from "vitest";

import {
  calculateSkillPower,
  getGatedSkillPower,
  getSongsUntilNextTier,
  getTierFromDifficulty,
  MIN_LEARNED_SONGS_FOR_TIER,
} from "./difficulty.utils";

const song = (avgDifficulty: number) => ({ avgDifficulty });

describe("getGatedSkillPower", () => {
  it("hides the tier (returns 0) below MIN_LEARNED_SONGS_FOR_TIER", () => {
    // Single A-tier song shouldn't be enough to claim an A-tier — the
    // underlying complaint in issue #638.
    const learned = [song(8)];
    expect(learned.length).toBeLessThan(MIN_LEARNED_SONGS_FOR_TIER);
    expect(getGatedSkillPower(learned)).toBe(0);
    expect(getTierFromDifficulty(getGatedSkillPower(learned))).toBe("?");
  });

  it("matches calculateSkillPower once the threshold is met", () => {
    const learned = [song(8), song(7), song(6), song(5), song(4)];
    expect(learned.length).toBeGreaterThanOrEqual(MIN_LEARNED_SONGS_FOR_TIER);
    expect(getGatedSkillPower(learned)).toBe(calculateSkillPower(learned));
  });
});

describe("getSongsUntilNextTier", () => {
  it("returns null below MIN_LEARNED_SONGS_FOR_TIER", () => {
    expect(getSongsUntilNextTier([song(8)])).toBeNull();
  });

  it("returns null once the player is already at the top tier", () => {
    const learned = [song(9.5), song(9.4), song(9.3), song(9.2), song(9.1)];
    expect(getTierFromDifficulty(calculateSkillPower(learned))).toBe("S");
    expect(getSongsUntilNextTier(learned)).toBeNull();
  });

  it("the returned songsNeeded actually levels the player up when simulated", () => {
    const learned = [song(5.9), song(5.8), song(5.7), song(4.5), song(4.2)];
    const startTier = getTierFromDifficulty(calculateSkillPower(learned));

    const progress = getSongsUntilNextTier(learned);
    expect(progress).not.toBeNull();
    expect(progress!.nextTier).not.toBe(startTier);

    const simulated = [...learned];
    for (let i = 0; i < progress!.songsNeeded; i++) {
      simulated.push(song(TIER_MIN_DIFFICULTY[progress!.nextTier]));
    }
    expect(getTierFromDifficulty(calculateSkillPower(simulated))).toBe(progress!.nextTier);

    // One fewer song must NOT be enough — songsNeeded should be the minimum.
    if (progress!.songsNeeded > 1) {
      simulated.pop();
      expect(getTierFromDifficulty(calculateSkillPower(simulated))).not.toBe(progress!.nextTier);
    }
  });
});

const TIER_MIN_DIFFICULTY: Record<string, number> = {
  D: 0,
  C: 4,
  B: 6,
  A: 7.5,
  S: 9,
};
