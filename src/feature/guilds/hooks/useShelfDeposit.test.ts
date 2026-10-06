import { EFFECT_DEFINITIONS } from "feature/arsenal/data/effectDefinitions";
import { GUITAR_DEFINITIONS } from "feature/arsenal/data/guitarDefinitions";
import type {
  EffectInventoryItem,
  InventoryItem,
} from "feature/arsenal/types/arsenal.types";
import { stashHonorValue } from "feature/guilds/utils/guildHonor.utils";
import { describe, expect, it } from "vitest";

import { resolveShelfDepositTarget } from "./useShelfDeposit";

const guitarDef = GUITAR_DEFINITIONS.find((g) => g.rarity === "Epic")!;
const effectDef = EFFECT_DEFINITIONS[0];

const data = {
  inventory: [
    // Promoted in the workshop — the shelf still prices the model's own rarity.
    { id: "g1", guitarId: guitarDef.id, buildLevel: 3 } as InventoryItem,
  ],
  effectInventory: [
    { id: "e1", effectId: effectDef.id } as EffectInventoryItem,
  ],
};

describe("resolveShelfDepositTarget", () => {
  it("names a guitar and prices it the way the server credits it", () => {
    expect(
      resolveShelfDepositTarget(data, { kind: "guitar", itemId: "g1" }),
    ).toEqual({
      kind: "guitar",
      name: `${guitarDef.brand} ${guitarDef.name}`,
      rarity: "Epic",
      honor: stashHonorValue("guitar", "Epic"),
    });
  });

  it("names a pedal the same way", () => {
    expect(
      resolveShelfDepositTarget(data, { kind: "effect", itemId: "e1" }),
    ).toEqual({
      kind: "effect",
      name: `${effectDef.brand} ${effectDef.name}`,
      rarity: effectDef.rarity,
      honor: stashHonorValue("effect", effectDef.rarity),
    });
  });

  it("is null for something no longer in the collection", () => {
    expect(
      resolveShelfDepositTarget(data, { kind: "guitar", itemId: "gone" }),
    ).toBeNull();
    expect(
      resolveShelfDepositTarget(
        { inventory: [], effectInventory: [] },
        { kind: "effect", itemId: "e1" },
      ),
    ).toBeNull();
  });
});
