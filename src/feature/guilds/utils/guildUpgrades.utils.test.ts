import {
  GUILD_MAX_SEATS,
  GUILD_MAX_STASH_ROWS,
  guildSeatLimit,
  guildStashRowLimit,
  nextSeatCost,
  nextStashRowCost,
  readFund,
} from "feature/guilds/utils/guildUpgrades.utils";
import {
  GUILD_BASE_SEATS,
  GUILD_MAX_SEAT_UPGRADES,
  GUILD_MAX_STASH_UPGRADES,
  GUILD_SEAT_COST_STEP,
  GUILD_SEAT_UPGRADE_COST,
  GUILD_SEATS_PER_UPGRADE,
  GUILD_STASH_BASE_ROWS,
  GUILD_STASH_ROW_COST,
  GUILD_STASH_ROW_COST_STEP,
  GUILD_STASH_ROWS_PER_UPGRADE,
} from "feature/supporterPanel/constants/supporterPanel.constants";
import { describe, expect, it } from "vitest";

describe("guildSeatLimit", () => {
  it("starts at the base and widens three at a time", () => {
    expect(guildSeatLimit(0)).toBe(GUILD_BASE_SEATS);
    expect(guildSeatLimit(1)).toBe(GUILD_BASE_SEATS + GUILD_SEATS_PER_UPGRADE);
    expect(guildSeatLimit(3)).toBe(
      GUILD_BASE_SEATS + 3 * GUILD_SEATS_PER_UPGRADE,
    );
  });

  it("stops at the ceiling however many purchases are claimed", () => {
    expect(guildSeatLimit(GUILD_MAX_SEAT_UPGRADES + 5)).toBe(GUILD_MAX_SEATS);
  });

  it("treats a guild founded before seats existed as an unwidened one", () => {
    expect(guildSeatLimit(undefined)).toBe(GUILD_BASE_SEATS);
    expect(guildSeatLimit(null)).toBe(GUILD_BASE_SEATS);
    expect(guildSeatLimit("lots")).toBe(GUILD_BASE_SEATS);
    expect(guildSeatLimit(-4)).toBe(GUILD_BASE_SEATS);
  });
});

describe("nextSeatCost", () => {
  it("charges more for every purchase after the first", () => {
    expect(nextSeatCost(0)).toBe(GUILD_SEAT_UPGRADE_COST);
    expect(nextSeatCost(1)).toBe(
      GUILD_SEAT_UPGRADE_COST + GUILD_SEAT_COST_STEP,
    );
    expect(nextSeatCost(2)).toBe(
      GUILD_SEAT_UPGRADE_COST + 2 * GUILD_SEAT_COST_STEP,
    );
  });

  it("has no price once the guild is as wide as it goes", () => {
    expect(nextSeatCost(GUILD_MAX_SEAT_UPGRADES)).toBeNull();
    expect(nextSeatCost(GUILD_MAX_SEAT_UPGRADES + 1)).toBeNull();
  });
});

describe("guildStashRowLimit", () => {
  it("starts at the base and grows a row at a time", () => {
    expect(guildStashRowLimit(0)).toBe(GUILD_STASH_BASE_ROWS);
    expect(guildStashRowLimit(2)).toBe(
      GUILD_STASH_BASE_ROWS + 2 * GUILD_STASH_ROWS_PER_UPGRADE,
    );
  });

  it("stops at the ceiling, and reads a guild from before rows were bought", () => {
    expect(guildStashRowLimit(GUILD_MAX_STASH_UPGRADES + 3)).toBe(
      GUILD_MAX_STASH_ROWS,
    );
    expect(guildStashRowLimit(undefined)).toBe(GUILD_STASH_BASE_ROWS);
  });
});

describe("nextStashRowCost", () => {
  it("charges more for every row after the first", () => {
    expect(nextStashRowCost(0)).toBe(GUILD_STASH_ROW_COST);
    expect(nextStashRowCost(2)).toBe(
      GUILD_STASH_ROW_COST + 2 * GUILD_STASH_ROW_COST_STEP,
    );
  });

  it("has no price once the shelf is as big as it goes", () => {
    expect(nextStashRowCost(GUILD_MAX_STASH_UPGRADES)).toBeNull();
  });
});

describe("readFund", () => {
  it("prices the next step off the purchases the guild has made", () => {
    expect(readFund("seats", { seatUpgrades: 1 })).toEqual({
      pot: 0,
      cost: GUILD_SEAT_UPGRADE_COST + GUILD_SEAT_COST_STEP,
      pledges: {},
    });
  });

  it("reads a guild that has never funded anything", () => {
    expect(readFund("stashRows", undefined)).toEqual({
      pot: 0,
      cost: GUILD_STASH_ROW_COST,
      pledges: {},
    });
  });

  it("carries the pot and who filled it", () => {
    const fund = readFund("stashRows", {
      stashUpgrades: 0,
      funds: { stashRows: { pot: 3, pledges: { ann: 2, bob: 1 } } },
    });

    expect(fund).toMatchObject({ pot: 3, pledges: { ann: 2, bob: 1 } });
  });

  it("drops pledges that are not amounts anybody paid", () => {
    const fund = readFund("seats", {
      funds: { seats: { pot: 2, pledges: { ann: 0, bob: "lots", cat: 4 } } },
    });

    expect(fund.pledges).toEqual({ cat: 4 });
  });

  it("never shows a pot bigger than the step it is paying for", () => {
    const fund = readFund("seats", {
      seatUpgrades: 0,
      funds: { seats: { pot: 9999 } },
    });

    expect(fund.pot).toBe(GUILD_SEAT_UPGRADE_COST);
  });

  it("has nothing to show once the track is maxed out", () => {
    const fund = readFund("seats", {
      seatUpgrades: GUILD_MAX_SEAT_UPGRADES,
      funds: { seats: { pot: 4 } },
    });

    expect(fund).toMatchObject({ pot: 0, cost: null });
  });
});
