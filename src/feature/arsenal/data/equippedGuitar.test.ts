import { describe, expect, it } from "vitest";

import type { ArsenalUserData, InventoryItem } from "../types/arsenal.types";
import { findEquippedGuitar, getEquippedRarity } from "./equippedGuitar";
import { GUITARS_BY_ID } from "./guitarDefinitions";

const EPIC = GUITARS_BY_ID.get(1)!;
const OTHER_EPIC = GUITARS_BY_ID.get(3)!;

const item = (over: Partial<InventoryItem> = {}): InventoryItem => ({
  id: "item-1",
  guitarId: EPIC.id,
  acquiredAt: 0,
  isNew: false,
  year: 2020,
  country: "USA",
  ...over,
});

const arsenal = (over: Partial<ArsenalUserData>): Partial<ArsenalUserData> => ({
  inventory: [],
  equippedGuitarId: null,
  equippedItemId: null,
  ...over,
});

describe("findEquippedGuitar", () => {
  it("picks the equipped copy, not another of the same model", () => {
    const equipped = item({ id: "copy-b", buildLevel: 3 });
    const found = findEquippedGuitar(
      arsenal({
        inventory: [item({ id: "copy-a" }), equipped],
        equippedItemId: "copy-b",
        equippedGuitarId: EPIC.id,
      }),
    );

    expect(found).toBe(equipped);
  });

  it("falls back to the guitarId for items equipped before item ids", () => {
    const found = findEquippedGuitar(
      arsenal({
        inventory: [item({ id: "legacy", guitarId: OTHER_EPIC.id }), item()],
        equippedGuitarId: OTHER_EPIC.id,
      }),
    );

    expect(found?.id).toBe("legacy");
  });

  it("returns null when nothing is equipped or the stash is empty", () => {
    expect(findEquippedGuitar(arsenal({ inventory: [item()] }))).toBeNull();
    expect(findEquippedGuitar(arsenal({ equippedItemId: "gone" }))).toBeNull();
    expect(findEquippedGuitar(null)).toBeNull();
  });
});

describe("getEquippedRarity", () => {
  it("reports the rarity the workshop promoted the guitar to", () => {
    expect(getEquippedRarity(item({ buildLevel: 3 }), EPIC)).toBe("Legendary");
  });

  it("reports the mint rarity while nothing has been built into it", () => {
    expect(getEquippedRarity(item(), EPIC)).toBe("Epic");
    expect(getEquippedRarity(null, EPIC)).toBe("Epic");
  });

  it("never lends a build level to a different guitar", () => {
    expect(
      getEquippedRarity(item({ guitarId: OTHER_EPIC.id, buildLevel: 3 }), EPIC),
    ).toBe("Epic");
  });

  it("has no rarity to report without a guitar", () => {
    expect(getEquippedRarity(item({ buildLevel: 3 }), null)).toBeNull();
  });
});
