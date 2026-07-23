import { describe, expect, it } from "vitest";

import { buildOwnershipMap, getDexProgress } from "./dex";

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
