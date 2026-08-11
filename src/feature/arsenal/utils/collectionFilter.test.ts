import { describe, expect, it } from "vitest";

import type { GuitarRarity } from "../types/arsenal.types";
import type { CollectionEntry } from "./collectionFilter";
import {
  filterAndSortEntries,
  filterEntries,
  isScopeVisible,
  matchesQuery,
  sortEntries,
} from "./collectionFilter";

const entry = (
  id: string,
  name: string,
  rarity: GuitarRarity,
  level: number,
  acquiredAt: number,
  groupKey = id,
): CollectionEntry<string> => ({
  item: id,
  name,
  rarity,
  level,
  acquiredAt,
  groupKey,
});

describe("matchesQuery", () => {
  it("matches everything for an empty or blank query", () => {
    expect(matchesQuery("Fairmont Stratocaster", "")).toBe(true);
    expect(matchesQuery("Fairmont Stratocaster", "   ")).toBe(true);
  });

  it("ignores case and surrounding whitespace", () => {
    expect(matchesQuery("Fairmont Stratocaster", "  STRAT ")).toBe(true);
  });

  it("matches the brand as well as the model", () => {
    expect(matchesQuery("Fairmont Stratocaster", "fairmont")).toBe(true);
    expect(matchesQuery("Fairmont Stratocaster", "grayson")).toBe(false);
  });
});

describe("filterEntries", () => {
  const entries = [
    entry("a", "Fairmont Stratocaster", "Common", 1, 1),
    entry("b", "Grayson Lewis Palmer", "Rare", 2, 2),
  ];

  it("keeps every entry when the query is empty", () => {
    expect(filterEntries(entries, "").length).toBe(2);
  });

  it("keeps only the matching entries", () => {
    expect(filterEntries(entries, "palmer").map((e) => e.item)).toEqual(["b"]);
  });
});

describe("sortEntries", () => {
  const common = entry("common", "Common one", "Common", 40, 100);
  const rareOld = entry("rare-old", "Rare old", "Rare", 5, 1);
  const rareNew = entry("rare-new", "Rare new", "Rare", 5, 999);
  const epic = entry("epic", "Epic one", "Epic", 1, 50);

  it("puts the rarest first by default", () => {
    const order = sortEntries([common, rareOld, epic], "rarity").map(
      (e) => e.item,
    );
    expect(order).toEqual(["epic", "rare-old", "common"]);
  });

  it("keeps copies of the same model together, best copy first", () => {
    const copyLow = entry("low", "Same model", "Rare", 3, 900, "model-1");
    const copyHigh = entry("high", "Same model", "Rare", 9, 1, "model-1");
    const other = entry("other", "Other model", "Rare", 6, 500, "model-2");
    const order = sortEntries([copyLow, other, copyHigh], "rarity").map(
      (e) => e.item,
    );
    expect(order).toEqual(["high", "low", "other"]);
  });

  it("sorts by level regardless of rarity", () => {
    const order = sortEntries([epic, common, rareOld], "level").map(
      (e) => e.item,
    );
    expect(order).toEqual(["common", "rare-old", "epic"]);
  });

  it("sorts newest first", () => {
    const order = sortEntries([rareOld, rareNew, epic], "newest").map(
      (e) => e.item,
    );
    expect(order).toEqual(["rare-new", "epic", "rare-old"]);
  });

  it("does not mutate the input array", () => {
    const input = [common, epic];
    sortEntries(input, "rarity");
    expect(input.map((e) => e.item)).toEqual(["common", "epic"]);
  });
});

describe("filterAndSortEntries", () => {
  it("filters first, then sorts, and returns the raw items", () => {
    const entries = [
      entry("a", "Fairmont Stratocaster", "Common", 1, 1),
      entry("b", "Fairmont Telecaster", "Legendary", 2, 2),
      entry("c", "Grayson Lewis Palmer", "Epic", 3, 3),
    ];
    expect(filterAndSortEntries(entries, "fairmont", "rarity")).toEqual([
      "b",
      "a",
    ]);
  });
});

describe("isScopeVisible", () => {
  it("shows both sections for the all scope", () => {
    expect(isScopeVisible("all", "guitars")).toBe(true);
    expect(isScopeVisible("all", "pedals")).toBe(true);
  });

  it("hides the other section for a narrowed scope", () => {
    expect(isScopeVisible("guitars", "pedals")).toBe(false);
    expect(isScopeVisible("pedals", "guitars")).toBe(false);
  });
});
