import {
  CHALLENGE_SONG_COUNT,
  FAME_CLEAR_BONUS,
  FAME_PER_SUBMISSION,
} from "feature/challenges/types/challenge.types";
import { describe, expect, it } from "vitest";

import {
  getSeasonFameReward,
  placeSuffix,
  SEASON_FAME_REWARDS,
  SEASON_REWARD_PLACES,
} from "./seasonRewards";

const FULL_BOARD_FAME =
  FAME_PER_SUBMISSION * CHALLENGE_SONG_COUNT + FAME_CLEAR_BONUS;

describe("season fame ladder", () => {
  it("pays every place it says it does", () => {
    expect(SEASON_REWARD_PLACES).toBe(SEASON_FAME_REWARDS.length);
    expect(SEASON_FAME_REWARDS.every((fame) => fame > 0)).toBe(true);
  });

  it("never pays a lower place more than a higher one", () => {
    for (let i = 1; i < SEASON_FAME_REWARDS.length; i++) {
      expect(SEASON_FAME_REWARDS[i]).toBeLessThan(SEASON_FAME_REWARDS[i - 1]);
    }
  });

  /**
   * The reason this ladder was rebalanced: 1st used to pay 500, exactly what a
   * single challenge recording pays and a fifth of a full board — a month of
   * leading the table worth less than an afternoon of recording. Winning the
   * season is the longest grind in the game and has to pay like the longest.
   */
  it("pays more for winning a season than for clearing a challenge board", () => {
    expect(SEASON_FAME_REWARDS[0]).toBeGreaterThan(FULL_BOARD_FAME);
  });

  // The tail is a consolation for being in the race, not a prize worth fighting
  // over — but last place still has to beat a case, or the row is decoration.
  it("keeps the last paid place worth landing", () => {
    expect(SEASON_FAME_REWARDS[SEASON_REWARD_PLACES - 1]).toBeGreaterThan(120);
  });

  describe("getSeasonFameReward", () => {
    it("reads the ladder by 1-based place", () => {
      expect(getSeasonFameReward(1)).toBe(SEASON_FAME_REWARDS[0]);
      expect(getSeasonFameReward(SEASON_REWARD_PLACES)).toBe(
        SEASON_FAME_REWARDS[SEASON_REWARD_PLACES - 1],
      );
    });

    it("returns null outside the ladder", () => {
      expect(getSeasonFameReward(SEASON_REWARD_PLACES + 1)).toBeNull();
      expect(getSeasonFameReward(0)).toBeNull();
    });
  });

  describe("placeSuffix", () => {
    it("names every place the ladder pays", () => {
      const named = SEASON_FAME_REWARDS.map(
        (_, i) => `${i + 1}${placeSuffix(i + 1)}`,
      );
      expect(named.slice(0, 5)).toEqual(["1st", "2nd", "3rd", "4th", "5th"]);
      expect(named.at(-1)).toBe(`${SEASON_REWARD_PLACES}th`);
    });
  });
});
