import { describe, expect, it } from "vitest";

import type {
  EffectInventoryItem,
  InventoryItem,
} from "../types/arsenal.types";
import {
  buildDexLookup,
  buildDiscoveredSet,
  buildOwnershipMap,
  getDexProgress,
} from "./dex";

interface FakeItem {
  id: string;
  defId: number;
  level: number;
}

const item = (id: string, defId: number, level: number): FakeItem => ({
  id,
  defId,
  level,
});

describe("buildOwnershipMap", () => {
  it("returns an empty map for no items", () => {
    const map = buildOwnershipMap<FakeItem>([], (i) => i.defId, (i) => i.level);
    expect(map.size).toBe(0);
  });

  it("counts copies per definition", () => {
    const map = buildOwnershipMap(
      [item("a", 1, 1), item("b", 1, 2), item("c", 2, 1)],
      (i) => i.defId,
      (i) => i.level
    );
    expect(map.get(1)?.count).toBe(2);
    expect(map.get(2)?.count).toBe(1);
    expect(map.has(3)).toBe(false);
  });

  it("keeps the highest-scoring copy as best", () => {
    const map = buildOwnershipMap(
      [item("a", 1, 2), item("b", 1, 5), item("c", 1, 3)],
      (i) => i.defId,
      (i) => i.level
    );
    expect(map.get(1)?.best.id).toBe("b");
  });

  it("keeps the first copy on a score tie", () => {
    const map = buildOwnershipMap(
      [item("a", 1, 2), item("b", 1, 2)],
      (i) => i.defId,
      (i) => i.level
    );
    expect(map.get(1)?.best.id).toBe("a");
  });
});

describe("buildDiscoveredSet", () => {
  it("keeps ids from the record that are no longer owned", () => {
    const discovered = buildDiscoveredSet([1, 2], [item("a", 3, 1)], (i) => i.defId);
    expect([...discovered].sort()).toEqual([1, 2, 3]);
  });

  it("seeds from the inventory when there is no record yet", () => {
    const discovered = buildDiscoveredSet(
      undefined,
      [item("a", 1, 1), item("b", 1, 2), item("c", 2, 1)],
      (i) => i.defId
    );
    expect([...discovered].sort()).toEqual([1, 2]);
  });

  it("is empty for an account with neither", () => {
    expect(buildDiscoveredSet(undefined, undefined, (i: FakeItem) => i.defId).size).toBe(
      0
    );
  });
});

describe("getDexProgress", () => {
  const defs = [
    { id: 1, rarity: "Common" as const },
    { id: 2, rarity: "Common" as const },
    { id: 3, rarity: "Mythic" as const },
  ];

  it("counts overall and per-rarity discovery", () => {
    const progress = getDexProgress(defs, new Set<number | string>([1, 3]));
    expect(progress.owned).toBe(2);
    expect(progress.total).toBe(3);
    expect(progress.byRarity.Common).toEqual({ owned: 1, total: 2 });
    expect(progress.byRarity.Mythic).toEqual({ owned: 1, total: 1 });
  });

  it("works with an ownership map as the owned lookup", () => {
    const map = new Map<number | string, unknown>([[2, {}]]);
    const progress = getDexProgress(defs, map);
    expect(progress.owned).toBe(1);
  });

  it("handles nothing owned", () => {
    const progress = getDexProgress(defs, new Set());
    expect(progress.owned).toBe(0);
    expect(progress.byRarity.Common).toEqual({ owned: 0, total: 2 });
  });
});

describe("buildDexLookup", () => {
  const guitar = (id: string, guitarId: number) =>
    ({ id, guitarId }) as unknown as InventoryItem;
  const effect = (id: string, effectId: string) =>
    ({ id, effectId }) as unknown as EffectInventoryItem;

  it("answers false/false with no data at all", () => {
    const lookup = buildDexLookup(undefined);
    expect(lookup("guitar", 1)).toEqual({ isOwned: false, inDex: false });
    expect(lookup("effect", "od-1")).toEqual({ isOwned: false, inDex: false });
  });

  it("marks what is in the stash as owned and discovered", () => {
    const lookup = buildDexLookup({
      inventory: [guitar("a", 1)],
      effectInventory: [effect("b", "od-1")],
    });
    expect(lookup("guitar", 1)).toEqual({ isOwned: true, inDex: true });
    expect(lookup("effect", "od-1")).toEqual({ isOwned: true, inDex: true });
  });

  it("marks a recorded model no longer held as Dex only", () => {
    const lookup = buildDexLookup({
      inventory: [],
      effectInventory: [],
      dexGuitars: [2],
      dexEffects: ["dl-3"],
    });
    expect(lookup("guitar", 2)).toEqual({ isOwned: false, inDex: true });
    expect(lookup("effect", "dl-3")).toEqual({ isOwned: false, inDex: true });
  });

  it("keeps guitars and pedals apart", () => {
    const lookup = buildDexLookup({
      inventory: [guitar("a", 7)],
      effectInventory: [],
      dexEffects: [7],
    });
    expect(lookup("guitar", 7)).toEqual({ isOwned: true, inDex: true });
    expect(lookup("effect", 7)).toEqual({ isOwned: false, inDex: true });
  });
});
