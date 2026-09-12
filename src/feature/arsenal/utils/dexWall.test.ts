import { describe, expect, it } from "vitest";

import type { DexWallEntry } from "./dexWall";
import {
  filterDexEntries,
  formatSlotNumber,
  paginateDexEntries,
} from "./dexWall";

const entry = (
  number: number,
  overrides: Partial<DexWallEntry> = {},
): DexWallEntry => ({
  key: `guitar-${number}`,
  kind: "guitar",
  id: number,
  number,
  name: `Guitar ${number}`,
  brand: "Fairmont",
  rarity: "Common",
  discovered: true,
  ownedCount: 1,
  ...overrides,
});

const wall = [
  entry(1, { rarity: "Mythic" }),
  entry(2, { rarity: "Rare", discovered: false, ownedCount: 0 }),
  entry(3, { rarity: "Rare", name: "Nyx VII", brand: "Izanor" }),
  entry(4, { discovered: false, ownedCount: 0 }),
];

const all = { rarity: "all", status: "all", query: "" } as const;

describe("filterDexEntries", () => {
  it("passes everything through with no filters", () => {
    expect(filterDexEntries(wall, all)).toHaveLength(4);
  });

  it("narrows by rarity and by discovery status", () => {
    expect(
      filterDexEntries(wall, { ...all, rarity: "Rare" }).map((e) => e.number),
    ).toEqual([2, 3]);
    expect(
      filterDexEntries(wall, { ...all, status: "missing" }).map(
        (e) => e.number,
      ),
    ).toEqual([2, 4]);
    expect(
      filterDexEntries(wall, { ...all, status: "discovered" }).map(
        (e) => e.number,
      ),
    ).toEqual([1, 3]);
  });

  it("searches discovered entries by name or brand, case-insensitively", () => {
    expect(
      filterDexEntries(wall, { ...all, query: "nyx" }).map((e) => e.number),
    ).toEqual([3]);
    expect(
      filterDexEntries(wall, { ...all, query: "IZANOR" }).map((e) => e.number),
    ).toEqual([3]);
  });

  it("never reveals a locked slot by name, only by its number", () => {
    expect(
      filterDexEntries(wall, { ...all, query: "Guitar 2" }).map(
        (e) => e.number,
      ),
    ).toEqual([]);
    expect(
      filterDexEntries(wall, { ...all, query: "02" }).map((e) => e.number),
    ).toEqual([2]);
    expect(
      filterDexEntries(wall, { ...all, query: "4" }).map((e) => e.number),
    ).toEqual([4]);
  });
});

describe("paginateDexEntries", () => {
  const thirty = Array.from({ length: 30 }, (_, i) => entry(i + 1));

  it("cuts eighteen to a page and reports the page count", () => {
    const first = paginateDexEntries(thirty, 0);
    expect(first.items.map((e) => e.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
    ]);
    expect(first.pageCount).toBe(2);
    expect(paginateDexEntries(thirty, 1).items.map((e) => e.number)).toEqual([
      19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
    ]);
    expect(paginateDexEntries(thirty, 0, 12).pageCount).toBe(3);
  });

  it("clamps a stale page index instead of showing an empty wall", () => {
    expect(paginateDexEntries(thirty, 9).page).toBe(1);
    expect(paginateDexEntries(thirty, -3).page).toBe(0);
    expect(paginateDexEntries([], 4)).toEqual({
      items: [],
      page: 0,
      pageCount: 1,
    });
  });
});

describe("formatSlotNumber", () => {
  it("pads to two digits", () => {
    expect(formatSlotNumber(7)).toBe("07");
    expect(formatSlotNumber(73)).toBe("73");
  });
});
