import { describe, expect, it } from "vitest";

import type { GuitarRarity } from "../types/arsenal.types";
import { pickCuratedDrop } from "./curatedDraw";

interface Entry {
  id: string;
  rarity: GuitarRarity;
}

const entry = (id: string, rarity: GuitarRarity): Entry => ({ id, rarity });

/** The Supporter slate's shape: exactly one item per rarity. */
const SLATE: Entry[] = [
  entry("mythic", "Mythic"),
  entry("legendary", "Legendary"),
  entry("epic", "Epic"),
  entry("rare", "Rare"),
  entry("uncommon", "Uncommon"),
  entry("common", "Common"),
];

/** The Featured pool's shape: 1/1/2/2/2/2, rarest first. */
const FEATURED: Entry[] = [
  entry("m1", "Mythic"),
  entry("l1", "Legendary"),
  entry("e1", "Epic"),
  entry("e2", "Epic"),
  entry("r1", "Rare"),
  entry("r2", "Rare"),
  entry("u1", "Uncommon"),
  entry("u2", "Uncommon"),
  entry("c1", "Common"),
  entry("c2", "Common"),
];

const draw = (
  pool: Entry[],
  rolled: GuitarRarity,
  owned: string[],
  random = () => 0,
): Entry | null =>
  pickCuratedDrop(
    pool,
    rolled,
    (e) => e.rarity,
    (e) => owned.includes(e.id),
    random,
  );

describe("pickCuratedDrop", () => {
  it("hands over the rolled rarity's item when the player does not have it", () => {
    expect(draw(SLATE, "Epic", [])?.id).toBe("epic");
  });

  it("substitutes downward rather than repeating a slate seat", () => {
    // Cookie's case: the slate's only Epic is already in the Dex, so a fourth
    // copy of it is exactly what this rule exists to stop.
    expect(draw(SLATE, "Epic", ["epic"])?.id).toBe("rare");
  });

  it("skips past lower rarities that are collected too", () => {
    expect(draw(SLATE, "Epic", ["epic", "rare", "uncommon"])?.id).toBe("common");
  });

  it("never substitutes upward, however much is missing above the roll", () => {
    // Everything at and below Epic is collected and only the two rarest seats
    // are left. Handing one of those over would make a fully-collected low end
    // into a Mythic printer — the roll's odds are a ceiling, so it repeats.
    const owned = ["epic", "rare", "uncommon", "common"];
    for (const random of [() => 0, () => 0.5, () => 0.99]) {
      expect(draw(SLATE, "Epic", owned, random)?.id).toBe("epic");
    }
  });

  it("prefers the missing item of the rolled rarity in a pool that has two", () => {
    expect(draw(FEATURED, "Epic", ["e1"])?.id).toBe("e2");
    expect(draw(FEATURED, "Epic", ["e2"])?.id).toBe("e1");
  });

  it("picks uniformly among the missing items of the rolled rarity", () => {
    expect(draw(FEATURED, "Rare", [], () => 0)?.id).toBe("r1");
    expect(draw(FEATURED, "Rare", [], () => 0.99)?.id).toBe("r2");
  });

  it("falls back to a duplicate once the whole pool is collected", () => {
    const owned = FEATURED.map((e) => e.id);
    expect(draw(FEATURED, "Legendary", owned)?.id).toBe("l1");
  });

  it("still returns something when the rolled rarity is absent from the pool", () => {
    // Slot counts guarantee this cannot happen; the draw must not return null
    // to a transaction that is about to write an item either way.
    const noEpics = FEATURED.filter((e) => e.rarity !== "Epic");
    expect(draw(noEpics, "Epic", [])?.id).toBe("r1");
    expect(draw(noEpics, "Epic", noEpics.map((e) => e.id))).not.toBeNull();
  });

  it("returns null only for an empty pool", () => {
    expect(draw([], "Epic", [])).toBeNull();
  });
});
