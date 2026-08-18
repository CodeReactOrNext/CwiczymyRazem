import { describe, expect, it } from "vitest";

import { EFFECT_DEFINITIONS } from "../data/effectDefinitions";
import { GUITAR_DEFINITIONS } from "../data/guitarDefinitions";
import type {
  EffectInventoryItem,
  InventoryItem,
} from "../types/arsenal.types";
import { getEffectDuplicates, getGuitarDuplicates } from "./duplicates";
import { countScrapParts } from "./scrap";

const guitar = GUITAR_DEFINITIONS[0];
const effect = EFFECT_DEFINITIONS[0];

const copy = (
  id: string,
  over: Partial<InventoryItem> = {},
): InventoryItem => ({
  id,
  guitarId: guitar.id,
  acquiredAt: 0,
  isNew: false,
  year: guitar.yearFrom,
  country: guitar.countries[0],
  condition: 0.5,
  ...over,
});

const pedal = (
  id: string,
  over: Partial<EffectInventoryItem> = {},
): EffectInventoryItem => ({
  id,
  effectId: effect.id,
  acquiredAt: 0,
  isNew: false,
  ...over,
});

const noRig = { equippedItemId: null, rigSlots: [null, null, null] };

describe("getGuitarDuplicates", () => {
  it("leaves a single copy alone", () => {
    const summary = getGuitarDuplicates([copy("a")], noRig);
    expect(summary.ids).toEqual([]);
    expect(summary.fame).toBe(0);
    expect(summary.parts).toEqual([]);
    expect(summary.partCount).toBe(0);
  });

  it("keeps the best copy and offers the rest", () => {
    const summary = getGuitarDuplicates(
      [copy("best", { buildLevel: 3 }), copy("spare"), copy("spare2")],
      noRig,
    );
    expect(summary.ids).toHaveLength(2);
    expect(summary.ids).not.toContain("best");
    expect(summary.fame).toBeGreaterThan(0);
  });

  it("never takes the equipped guitar or one racked in the rig", () => {
    const inventory = [
      copy("best", { buildLevel: 5 }),
      copy("equipped"),
      copy("racked"),
      copy("spare"),
    ];
    const summary = getGuitarDuplicates(inventory, {
      equippedItemId: "equipped",
      rigSlots: [null, "racked", null],
    });
    expect(summary.ids).toEqual(["spare"]);
  });

  // The dialog offers scrapping the same batch, so the yield has to be priced
  // for exactly the copies the sweep would take — not for the kept one.
  it("prices the batch as a teardown too", () => {
    const summary = getGuitarDuplicates(
      [copy("best", { buildLevel: 4 }), copy("spare"), copy("spare2")],
      noRig,
    );
    expect(summary.partCount).toBeGreaterThan(0);
    expect(countScrapParts(summary.parts)).toBe(summary.partCount);
    // Merged, so a part/tier pair is listed once with a summed quantity.
    const keys = summary.parts.map((p) => `${p.partId}:${p.tier}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("counts the mods a teardown would pull out whole", () => {
    const summary = getGuitarDuplicates(
      [
        copy("best", { buildLevel: 4 }),
        copy("modded", { features: [{ id: "coil-split", points: 3 }] }),
        copy("plain"),
      ],
      noRig,
    );
    expect(summary.ids).toHaveLength(2);
    expect(summary.salvagedCount).toBe(1);
  });
});

describe("getEffectDuplicates", () => {
  it("keeps the best copy and skips anything on the board", () => {
    const summary = getEffectDuplicates(
      [pedal("best", { buildLevel: 3 }), pedal("onBoard"), pedal("spare")],
      new Set(["onBoard"]),
    );
    expect(summary.ids).toEqual(["spare"]);
    expect(summary.fame).toBeGreaterThan(0);
    expect(summary.partCount).toBeGreaterThan(0);
  });

  it("pays nothing for a pedal owned once", () => {
    const summary = getEffectDuplicates([pedal("only")], new Set());
    expect(summary.ids).toEqual([]);
    expect(summary.partCount).toBe(0);
    expect(summary.salvagedCount).toBe(0);
  });
});
