import { describe, expect, it } from "vitest";

import { rarityLockLvl } from "./usePlayerLvl";

describe("rarityLockLvl", () => {
  it("names the level a rarity the account cannot equip yet is waiting for", () => {
    expect(rarityLockLvl("Mythic", 1)).toBe(15);
    expect(rarityLockLvl("Epic", 3)).toBe(6);
  });

  it("says nothing once the account has the level", () => {
    expect(rarityLockLvl("Mythic", 15)).toBeNull();
    expect(rarityLockLvl("Common", 1)).toBeNull();
  });

  it("stays silent where the gear is not the viewer's", () => {
    // No provider, no level, no badge — a stranger's Mythic is not locked to
    // anybody looking at their profile.
    expect(rarityLockLvl("Mythic", null)).toBeNull();
  });

  it("leaves a piece already in the rig alone", () => {
    // The grandfather clause `findBlockedRigChange` enforces: whatever is
    // already in a slot stays there, so badging it would be a lie.
    expect(rarityLockLvl("Mythic", 1, true)).toBeNull();
  });

  it("reads the rarity it is given, promotions included", () => {
    // Callers pass the *effective* rarity, so a Rare the bench pushed to Epic
    // arrives here as an Epic and gets the Epic threshold.
    expect(rarityLockLvl("Epic", 5)).toBe(6);
    expect(rarityLockLvl("Rare", 5)).toBeNull();
  });
});
