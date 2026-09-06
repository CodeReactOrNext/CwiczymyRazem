import {
  HONOR_PER_FAME,
  HONOR_PER_TOKEN,
  honorFor,
  honorForFame,
  honorForTokens,
  rankByHonor,
  readHonor,
  stashHonorValue,
  TAKE_DAILY_LIMIT,
  TAKE_HONOR_COST,
} from "feature/guilds/utils/guildHonor.utils";
import { describe, expect, it } from "vitest";

describe("earning honor", () => {
  it("pays Fame and tokens in at their rates, whole and never negative", () => {
    expect(honorForFame(300)).toBe(300 * HONOR_PER_FAME);
    expect(honorForTokens(6)).toBe(6 * HONOR_PER_TOKEN);
    expect(honorForFame(2.7)).toBe(Math.floor(2.7 * HONOR_PER_FAME));
    expect(honorForFame(-5)).toBe(0);
    expect(honorForTokens(Number.NaN)).toBe(0);
  });

  it("prices a token well above a Fame", () => {
    expect(HONOR_PER_TOKEN).toBeGreaterThan(HONOR_PER_FAME * 5);
  });
});

describe("taking off the shelf", () => {
  it("is a flat toll a single deposit can cover many times over", () => {
    expect(TAKE_HONOR_COST).toBeGreaterThan(0);
    expect(honorForFame(300)).toBeGreaterThan(TAKE_HONOR_COST * 5);
  });

  it("caps a member's takes well under what the toll alone would allow", () => {
    expect(TAKE_DAILY_LIMIT).toBeGreaterThan(0);
    expect(TAKE_DAILY_LIMIT).toBeLessThan(50);
  });
});

describe("stashHonorValue", () => {
  it("prices gear by rarity, and unknown rarities as the plainest", () => {
    expect(stashHonorValue("guitar", "Common")).toBeLessThan(
      stashHonorValue("guitar", "Rare"),
    );
    expect(stashHonorValue("guitar", "Rare")).toBeLessThan(
      stashHonorValue("guitar", "Custom Shop"),
    );
    expect(stashHonorValue("effect", "Epic")).toBe(
      stashHonorValue("guitar", "Epic"),
    );
    expect(stashHonorValue("guitar", "Shiny")).toBe(
      stashHonorValue("guitar", "Common"),
    );
  });

  it("prices parts per piece, by tier", () => {
    expect(stashHonorValue("part", "Standard", 12)).toBe(
      12 * stashHonorValue("part", "Standard", 1),
    );
    expect(stashHonorValue("part", "Unique", 1)).toBeGreaterThan(
      stashHonorValue("part", "Epic", 1),
    );
    // A nonsense amount is one piece, never zero: nothing leaves for free.
    expect(stashHonorValue("part", "Standard", 0)).toBe(
      stashHonorValue("part", "Standard", 1),
    );
  });

  it("never prices anything at nothing", () => {
    for (const kind of ["guitar", "effect", "part", "mod"] as const) {
      expect(stashHonorValue(kind, "")).toBeGreaterThan(0);
    }
  });
});

describe("readHonor", () => {
  it("reads earned, spent and the balance per member, tolerating garbage", () => {
    const honor = readHonor({
      honor: {
        ann: { earned: 300, spent: 120 },
        bob: { earned: "50", spent: 200 },
        cid: null,
        dee: { earned: -4 },
      },
    });

    expect(honor.ann).toEqual({ earned: 300, spent: 120, balance: 180 });
    // Spent above earned reads as nothing left, not as a debt.
    expect(honor.bob).toEqual({ earned: 50, spent: 200, balance: 0 });
    expect(honor.cid).toEqual({ earned: 0, spent: 0, balance: 0 });
    expect(honor.dee).toEqual({ earned: 0, spent: 0, balance: 0 });

    expect(readHonor({})).toEqual({});
    expect(readHonor({ honor: "nonsense" })).toEqual({});
    expect(readHonor(undefined)).toEqual({});
  });

  it("answers for one member, with none for a stranger", () => {
    const data = { honor: { ann: { earned: 10, spent: 0 } } };
    expect(honorFor(data, "ann").balance).toBe(10);
    expect(honorFor(data, "zed")).toEqual({ earned: 0, spent: 0, balance: 0 });
  });

  it("ranks the roster by what they have earned, not what they have left", () => {
    const ranked = rankByHonor(
      readHonor({
        honor: {
          ann: { earned: 100, spent: 100 },
          bob: { earned: 60, spent: 0 },
          cid: { earned: 100, spent: 0 },
        },
      }),
    );

    expect(ranked.map((entry) => entry.uid)).toEqual(["ann", "cid", "bob"]);
  });
});
