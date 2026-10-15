import { describe, expect, it } from "vitest";

import type { CaseDefinition } from "../types/arsenal.types";
import {
  advancePity,
  EMPTY_PITY,
  getPityForce,
  getPityStatus,
  hasPity,
  isAtLeast,
  readPity,
} from "./pity";

/** Elite's rules: a new model within 5 opens, Legendary or better within 15. */
const ELITE: Pick<CaseDefinition, "id" | "pity"> = {
  id: "elite-guitar",
  pity: { newWithin: 5, top: { rarity: "Legendary", within: 15 } },
};

/** The Vault's single rule. */
const VAULT: Pick<CaseDefinition, "id" | "pity"> = {
  id: "vault-guitar",
  pity: { top: { rarity: "Mythic", within: 20 } },
};

const NONE: Pick<CaseDefinition, "id" | "pity"> = { id: "daily" };

describe("hasPity", () => {
  it("is true for any case with a rule and false for one without", () => {
    expect(hasPity(ELITE)).toBe(true);
    expect(hasPity(VAULT)).toBe(true);
    expect(hasPity(NONE)).toBe(false);
  });
});

describe("readPity", () => {
  it("reads a fresh counter for a case the player has never opened", () => {
    expect(readPity(undefined, ELITE)).toEqual(EMPTY_PITY);
    expect(readPity({}, ELITE)).toEqual(EMPTY_PITY);
    expect(readPity(null, ELITE)).toEqual(EMPTY_PITY);
  });

  it("reads what is stored for that case and no other", () => {
    const state = { "elite-guitar": { sinceNew: 3, sinceTop: 9 } };
    expect(readPity(state, ELITE)).toEqual({ sinceNew: 3, sinceTop: 9 });
    expect(readPity(state, VAULT)).toEqual(EMPTY_PITY);
  });

  it("never trusts a counter past what the rule allows", () => {
    // A stored 999 must read as the owed open, not as a number the card prints.
    const state = { "elite-guitar": { sinceNew: 999, sinceTop: 999 } };
    expect(readPity(state, ELITE)).toEqual({ sinceNew: 4, sinceTop: 14 });
  });

  it("treats garbage as zero", () => {
    const state = { "elite-guitar": { sinceNew: -3, sinceTop: "x" } };
    expect(readPity(state as never, ELITE)).toEqual(EMPTY_PITY);
  });
});

describe("getPityForce", () => {
  it("owes nothing on a fresh counter", () => {
    expect(getPityForce(ELITE, EMPTY_PITY)).toEqual({ new: false, top: false });
  });

  it("owes the new model on the open after within − 1 misses", () => {
    expect(getPityForce(ELITE, { sinceNew: 3, sinceTop: 0 }).new).toBe(false);
    expect(getPityForce(ELITE, { sinceNew: 4, sinceTop: 0 }).new).toBe(true);
  });

  it("owes the top rarity on the open after within − 1 misses", () => {
    expect(getPityForce(ELITE, { sinceNew: 0, sinceTop: 13 }).top).toBe(false);
    expect(getPityForce(ELITE, { sinceNew: 0, sinceTop: 14 }).top).toBe(true);
  });

  it("never owes a rule the case does not have", () => {
    expect(getPityForce(VAULT, { sinceNew: 50, sinceTop: 0 }).new).toBe(false);
    expect(getPityForce(NONE, { sinceNew: 50, sinceTop: 50 })).toEqual({
      new: false,
      top: false,
    });
  });
});

describe("getPityStatus", () => {
  it("reads the full distance on a fresh counter", () => {
    expect(getPityStatus(ELITE, EMPTY_PITY)).toEqual({
      opensUntilNew: 5,
      opensUntilTop: 15,
      topRarity: "Legendary",
    });
  });

  it("reads 1 on the open that is owed", () => {
    const status = getPityStatus(ELITE, { sinceNew: 4, sinceTop: 14 });
    expect(status.opensUntilNew).toBe(1);
    expect(status.opensUntilTop).toBe(1);
  });

  it("is null for a rule the case lacks", () => {
    expect(getPityStatus(VAULT, EMPTY_PITY).opensUntilNew).toBeNull();
    expect(getPityStatus(NONE, EMPTY_PITY)).toEqual({
      opensUntilNew: null,
      opensUntilTop: null,
      topRarity: null,
    });
  });

  it("counts down exactly as the guarantee comes due", () => {
    // The number on the card and the open that is forced must be the same open.
    let counters = EMPTY_PITY;
    for (let open = 1; open <= 4; open++) {
      expect(getPityStatus(ELITE, counters).opensUntilNew).toBe(6 - open);
      expect(getPityForce(ELITE, counters).new).toBe(false);
      counters = advancePity(ELITE, counters, { isNew: false, rarity: "Rare" });
    }
    expect(getPityStatus(ELITE, counters).opensUntilNew).toBe(1);
    expect(getPityForce(ELITE, counters).new).toBe(true);
  });
});

describe("isAtLeast", () => {
  it("reads the drop ladder", () => {
    expect(isAtLeast("Mythic", "Legendary")).toBe(true);
    expect(isAtLeast("Legendary", "Legendary")).toBe(true);
    expect(isAtLeast("Epic", "Legendary")).toBe(false);
    expect(isAtLeast("Common", "Common")).toBe(true);
  });

  it("never lets Custom Shop satisfy a rule — it is not a drop", () => {
    expect(isAtLeast("Custom Shop", "Common")).toBe(false);
  });
});

describe("advancePity", () => {
  it("counts a duplicate toward the new-model rule and resets on a new model", () => {
    const afterDupes = [0, 1, 2].reduce(
      (c) => advancePity(ELITE, c, { isNew: false, rarity: "Rare" }),
      EMPTY_PITY,
    );
    expect(afterDupes.sinceNew).toBe(3);
    expect(
      advancePity(ELITE, afterDupes, { isNew: true, rarity: "Rare" }).sinceNew,
    ).toBe(0);
  });

  it("counts a pull below the top rarity and resets on one at or above it", () => {
    const below = advancePity(ELITE, EMPTY_PITY, {
      isNew: true,
      rarity: "Epic",
    });
    expect(below.sinceTop).toBe(1);
    expect(
      advancePity(ELITE, below, { isNew: true, rarity: "Legendary" }).sinceTop,
    ).toBe(0);
    expect(
      advancePity(ELITE, below, { isNew: true, rarity: "Mythic" }).sinceTop,
    ).toBe(0);
  });

  it("caps at the owed open so an unpayable guarantee does not run away", () => {
    let counters = EMPTY_PITY;
    for (let i = 0; i < 100; i++) {
      counters = advancePity(ELITE, counters, { isNew: false, rarity: "Rare" });
    }
    expect(counters).toEqual({ sinceNew: 4, sinceTop: 14 });
  });

  it("keeps a rule the case lacks at zero", () => {
    const next = advancePity(VAULT, EMPTY_PITY, {
      isNew: false,
      rarity: "Epic",
    });
    expect(next.sinceNew).toBe(0);
    expect(next.sinceTop).toBe(1);
  });
});
