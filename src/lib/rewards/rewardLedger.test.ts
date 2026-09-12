import { describe, expect, it } from "vitest";

import { EMPTY_REWARD_LEDGER, readRewardLedger } from "./rewardLedger";

describe("readRewardLedger", () => {
  it("reads an account that has never been paid anything as empty", () => {
    expect(readRewardLedger(undefined)).toStrictEqual(EMPTY_REWARD_LEDGER);
    expect(readRewardLedger({})).toStrictEqual(EMPTY_REWARD_LEDGER);
  });

  it("keeps only the ids that are ids", () => {
    const ledger = readRewardLedger({
      rewards: { claimedLevels: ["level_3", 7, null, "level_5"] },
    });
    expect(ledger.claimedLevels).toStrictEqual(["level_3", "level_5"]);
  });

  describe("the level baseline", () => {
    it("is null until it has been sealed", () => {
      expect(readRewardLedger({ rewards: {} }).levelBaseline).toBeNull();
    });

    it("reads the sealed rung back", () => {
      expect(
        readRewardLedger({ rewards: { levelBaseline: 30 } }).levelBaseline,
      ).toBe(30);
    });

    it("refuses anything that is not a rung", () => {
      // Never coerced: a zero or a stray string read as a baseline of 0 would
      // put the whole climb back on the books.
      for (const stored of [0, -4, "30", null, Number.NaN]) {
        expect(
          readRewardLedger({ rewards: { levelBaseline: stored } })
            .levelBaseline,
        ).toBeNull();
      }
    });
  });
});
