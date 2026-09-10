import { getEffectiveRarity } from "feature/arsenal/data/itemStats";
import { describe, expect, it } from "vitest";

import {
  checkEffectEquip,
  checkGuitarEquip,
  findBlockedRigChange,
} from "./equipGuard";

/** Catalogue entries the ladder actually has something to say about. */
const COMMON_GUITAR = 8;
const LEGENDARY_GUITAR = 10;
const LEGENDARY_EFFECT = 11;

const guitar = (
  guitarId: number,
  over: { id?: string; buildLevel?: number } = {},
) => ({
  id: over.id ?? "item-1",
  guitarId,
  buildLevel: over.buildLevel,
});

const effect = (effectId: number, id = "eff-1") => ({ id, effectId });

describe("checkGuitarEquip", () => {
  it("lets a common instrument through at level one", () => {
    expect(checkGuitarEquip(guitar(COMMON_GUITAR), 1)).toBeNull();
  });

  it("refuses a legendary until its level, and explains itself", () => {
    const blocked = checkGuitarEquip(guitar(LEGENDARY_GUITAR), 9);
    expect(blocked).toMatchObject({ rarity: "Legendary", requiredLvl: 10 });
    expect(blocked?.name).toBeTruthy();
    expect(checkGuitarEquip(guitar(LEGENDARY_GUITAR), 10)).toBeNull();
  });

  it("reads the rarity the bench promoted it to, not the one it was minted at", () => {
    // A build level high enough to promote turns a Common into something the
    // ladder has to gate; going by the catalogue would make the workshop a way
    // round the cap.
    const buildLevel = 30;
    const promoted = getEffectiveRarity("Common", buildLevel);
    const blocked = checkGuitarEquip(guitar(COMMON_GUITAR, { buildLevel }), 1);

    if (promoted === "Common") {
      expect(blocked).toBeNull();
    } else {
      expect(blocked?.rarity).toBe(promoted);
    }
  });

  it("never strands an instrument the catalogue has forgotten", () => {
    expect(checkGuitarEquip(guitar(999999), 1)).toBeNull();
  });
});

describe("checkEffectEquip", () => {
  it("holds pedals to the same ladder", () => {
    expect(checkEffectEquip(effect(LEGENDARY_EFFECT), 9)).toMatchObject({
      rarity: "Legendary",
      requiredLvl: 10,
    });
    expect(checkEffectEquip(effect(LEGENDARY_EFFECT), 10)).toBeNull();
  });
});

describe("findBlockedRigChange", () => {
  const arsenal = {
    inventory: [
      guitar(COMMON_GUITAR, { id: "common-1" }),
      guitar(LEGENDARY_GUITAR, { id: "legend-1" }),
    ],
    effectInventory: [effect(LEGENDARY_EFFECT, "legend-pedal")],
  };

  const emptyRig = { guitarSlots: [null, null, null], pedalboardItems: [] };

  it("refuses a guitar the level cannot wear yet", () => {
    const blocked = findBlockedRigChange(
      { ...arsenal, rig: emptyRig },
      { guitarSlots: ["legend-1", null, null] },
      5,
    );
    expect(blocked?.itemId).toBe("legend-1");
  });

  it("leaves a rig that was built before the ladder existed alone", () => {
    // The Legendary is already in the slot: a low level must not knock it out,
    // and must not block a write that merely keeps it there.
    const blocked = findBlockedRigChange(
      {
        ...arsenal,
        rig: { guitarSlots: ["legend-1", null, null], pedalboardItems: [] },
      },
      { guitarSlots: ["legend-1", "common-1", null] },
      5,
    );
    expect(blocked).toBeNull();
  });

  it("refuses a pedal the level cannot wear yet", () => {
    const blocked = findBlockedRigChange(
      { ...arsenal, rig: emptyRig },
      { pedalboardItemIds: ["legend-pedal"] },
      5,
    );
    expect(blocked?.itemId).toBe("legend-pedal");
  });

  it("lets the whole rig through once the level is high enough", () => {
    expect(
      findBlockedRigChange(
        { ...arsenal, rig: emptyRig },
        {
          guitarSlots: ["legend-1", "common-1", null],
          pedalboardItemIds: ["legend-pedal"],
        },
        10,
      ),
    ).toBeNull();
  });

  it("ignores an id the stash does not have", () => {
    expect(
      findBlockedRigChange(
        { ...arsenal, rig: emptyRig },
        { guitarSlots: ["ghost", null, null] },
        1,
      ),
    ).toBeNull();
  });
});
