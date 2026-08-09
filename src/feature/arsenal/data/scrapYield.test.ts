import { describe, expect, it } from "vitest";

import type { GuitarRarity, ScrapPart } from "../types/arsenal.types";
import { EFFECT_BOM_BY_TYPE, getEffectBom } from "./effectBom";
import { EFFECT_DEFINITIONS } from "./effectDefinitions";
import { getGuitarBom, GUITAR_BOMS } from "./guitarBom";
import { GUITAR_DEFINITIONS } from "./guitarDefinitions";
import { PART_DEFINITIONS, PART_TIERS, PARTS_BY_ID } from "./partDefinitions";
import {
  getScrapYield,
  getScrewYield,
  mergeScrapParts,
  RARITY_SLOT_COUNT,
} from "./scrapYield";

const ALL_RARITIES: GuitarRarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
];

/**
 * The BOM half of a yield. Screws are handed out on top of the BOM now, so the
 * slot-depth invariants below have to look past them.
 */
const bomSlots = (parts: ScrapPart[]) =>
  parts.filter((p) => p.partId !== "screws");

const tierOf = (parts: ScrapPart[], partId: string) =>
  parts.find((p) => p.partId === partId)?.tier;
const has = (parts: ScrapPart[], partId: string) =>
  parts.some((p) => p.partId === partId);

/** Every (part, tier) pair the whole pool can actually produce. */
const reachablePairs = (): Set<string> => {
  const seen = new Set<string>();
  const collect = (parts: ScrapPart[]) => {
    for (const p of parts) seen.add(`${p.partId}:${p.tier}`);
  };
  for (const g of GUITAR_DEFINITIONS) {
    collect(getScrapYield({ bom: getGuitarBom(g.id), rarity: g.rarity }));
  }
  for (const e of EFFECT_DEFINITIONS) {
    collect(
      getScrapYield({ bom: getEffectBom(e.id, e.type), rarity: e.rarity }),
    );
  }
  return seen;
};

describe("getScrapYield", () => {
  it("pays out the same list every time for the same item", () => {
    const input = { bom: getGuitarBom(24), rarity: "Epic" as const };
    expect(getScrapYield(input)).toEqual(getScrapYield(input));
  });

  it("never yields more than four parts, whatever the rarity", () => {
    for (const rarity of ALL_RARITIES) {
      for (const g of GUITAR_DEFINITIONS) {
        expect(
          bomSlots(getScrapYield({ bom: getGuitarBom(g.id), rarity })).length,
        ).toBeLessThanOrEqual(4);
      }
    }
  });

  it("hands out more slots the rarer the gear is", () => {
    const bom = getGuitarBom(24); // Stratocaster — four slots deep
    const counts = ALL_RARITIES.map(
      (r) => bomSlots(getScrapYield({ bom, rarity: r })).length,
    );
    expect(counts).toEqual([1, 2, 3, 3, 3, 4]);
    // Monotone: a rarer item never yields fewer slots.
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1]);
    }
  });

  it("never yields nothing", () => {
    const parts = getScrapYield({ bom: getGuitarBom(8), rarity: "Common" });
    expect(bomSlots(parts)).toHaveLength(1);
  });

  it("pays out screws even when a BOM was authored empty", () => {
    expect(getScrapYield({ bom: [], rarity: "Common" })).toEqual([
      { partId: "screws", tier: "Standard", qty: getScrewYield("Common") },
    ]);
  });

  it("hands out screws from every teardown, the deeper the more", () => {
    for (const g of GUITAR_DEFINITIONS) {
      for (const rarity of ALL_RARITIES) {
        const parts = getScrapYield({ bom: getGuitarBom(g.id), rarity });
        const screws = parts.find((p) => p.partId === "screws");
        expect(screws?.qty ?? 0).toBeGreaterThanOrEqual(getScrewYield(rarity));
        expect(screws?.tier).toBe("Standard");
      }
    }
    expect(getScrewYield("Mythic")).toBeGreaterThan(getScrewYield("Common"));
  });

  it("locks no part type behind rarity — a Common still gives its headline part", () => {
    // 24 = Stratocaster (Common). Pickups lead its salvage order, so they come off
    // even at the bottom of the pool, just at Standard.
    const parts = getScrapYield({ bom: getGuitarBom(24), rarity: "Common" });
    expect(bomSlots(parts)).toEqual([
      { partId: "pickup", tier: "Standard", qty: 3 },
    ]);
  });

  it("mixes tiers within one teardown instead of paying out a flat grade", () => {
    const legendary = getScrapYield({
      bom: getGuitarBom(44),
      rarity: "Legendary",
    });
    expect(bomSlots(legendary).map((p) => p.tier)).toEqual([
      "Legendary",
      "Legendary",
      "Epic",
    ]);

    const epic = getScrapYield({ bom: getGuitarBom(44), rarity: "Epic" });
    expect(bomSlots(epic).map((p) => p.tier)).toEqual([
      "Epic",
      "Epic",
      "Standard",
    ]);
  });

  it("gives Standard parts for Common and Uncommon gear", () => {
    for (const rarity of ["Common", "Uncommon"] as const) {
      const parts = getScrapYield({ bom: getGuitarBom(24), rarity });
      expect(parts.every((p) => p.tier === "Standard")).toBe(true);
    }
  });

  it("yields Unique parts only from Mythic gear, and only where they show", () => {
    // 43 = Stratocaster Heavy Relic (Mythic) — [pickup, neck, body, tuners]
    const mythic = getScrapYield({ bom: getGuitarBom(43), rarity: "Mythic" });
    expect(tierOf(mythic, "pickup")).toBe("Unique");
    expect(tierOf(mythic, "body")).toBe("Unique");
    // Non-showing parts stay on the normal ladder.
    expect(tierOf(mythic, "neck")).toBe("Legendary");
    expect(tierOf(mythic, "tuners")).toBe("Epic");

    const legendary = getScrapYield({
      bom: getGuitarBom(43),
      rarity: "Legendary",
    });
    expect(legendary.some((p) => p.tier === "Unique")).toBe(false);
  });

  it("caps each part at its own max tier", () => {
    const parts = getScrapYield({
      bom: [
        { partId: "body", qty: 1 },
        { partId: "pot", qty: 1 },
        { partId: "screws", qty: 1 },
      ],
      rarity: "Legendary",
    });
    expect(tierOf(parts, "body")).toBe("Legendary");
    expect(tierOf(parts, "pot")).toBe("Epic"); // pot maxes at Epic
    expect(tierOf(parts, "screws")).toBe("Standard");
  });

  it("upgrades the part a rolled feature corresponds to", () => {
    const bom = [
      { partId: "tuners" as const, qty: 1 },
      { partId: "pot" as const, qty: 1 },
    ];
    // Uncommon reaches two slots, so the untouched part is visible alongside.
    const plain = getScrapYield({ bom, rarity: "Uncommon" });
    const withLocking = getScrapYield({
      bom,
      rarity: "Uncommon",
      features: [{ id: "locking-tuners", points: 2 }],
    });

    expect(tierOf(plain, "tuners")).toBe("Standard");
    expect(tierOf(withLocking, "tuners")).toBe("Epic");
    // An unrelated part is untouched.
    expect(tierOf(withLocking, "pot")).toBe("Standard");
  });

  it("ignores features that map to no physical part", () => {
    const withSetup = getScrapYield({
      bom: [{ partId: "tuners", qty: 1 }],
      rarity: "Common",
      features: [{ id: "low-action", points: 2 }],
    });
    expect(tierOf(withSetup, "tuners")).toBe("Standard");
  });

  it("keeps the yield in salvage order so the headline part reads first", () => {
    const parts = getScrapYield({ bom: getGuitarBom(44), rarity: "Legendary" });
    expect(bomSlots(parts).map((p) => p.partId)).toEqual([
      "pickup",
      "neck",
      "body",
    ]);
    // Filler brings up the rear — it should never push the headline part down.
    expect(parts[parts.length - 1].partId).toBe("screws");
  });
});

describe("construction rules", () => {
  it("never yields a neck from a set-neck guitar", () => {
    // 42 = Eclipse Custom (Legendary single-cut)
    const parts = getScrapYield({ bom: getGuitarBom(42), rarity: "Mythic" });
    expect(has(parts, "body")).toBe(true);
    expect(has(parts, "neck")).toBe(false);
  });

  it("never yields tuners from a headless guitar", () => {
    // 1 = Skalberg SV6 Core
    const parts = getScrapYield({ bom: getGuitarBom(1), rarity: "Mythic" });
    expect(has(parts, "tuners")).toBe(false);
    expect(has(parts, "body")).toBe(true);
  });

  it("never yields an op-amp from a fuzz", () => {
    const parts = getScrapYield({
      bom: getEffectBom(11, "Fuzz"),
      rarity: "Mythic",
    });
    expect(has(parts, "opamp")).toBe(false);
    expect(has(parts, "diode")).toBe(true);
  });
});

describe("tier coverage across the whole pool", () => {
  it("keeps every part reachable at every tier it can roll", () => {
    const seen = reachablePairs();
    const missing: string[] = [];

    for (const def of PART_DEFINITIONS) {
      const maxIndex = PART_TIERS.indexOf(def.maxTier);
      for (let i = 0; i <= maxIndex; i++) {
        const key = `${def.id}:${PART_TIERS[i]}`;
        if (!seen.has(key)) missing.push(key);
      }
      if (def.unique && !seen.has(`${def.id}:Unique`))
        missing.push(`${def.id}:Unique`);
    }

    expect(missing).toEqual([]);
  });

  it("never produces a tier a part is not allowed to reach", () => {
    for (const pair of reachablePairs()) {
      const [partId, tier] = pair.split(":");
      const def = PARTS_BY_ID.get(partId as never)!;
      if (tier === "Unique") {
        expect(def.unique).toBe(true);
      } else {
        expect(PART_TIERS.indexOf(tier as never)).toBeLessThanOrEqual(
          PART_TIERS.indexOf(def.maxTier),
        );
      }
    }
  });
});

describe("mergeScrapParts", () => {
  it("folds bulk yields into one stacked list", () => {
    const merged = mergeScrapParts([
      [{ partId: "screws", tier: "Standard", qty: 2 }],
      [
        { partId: "screws", tier: "Standard", qty: 3 },
        { partId: "body", tier: "Epic", qty: 1 },
      ],
    ]);
    expect(merged).toEqual([
      { partId: "body", tier: "Epic", qty: 1 },
      { partId: "screws", tier: "Standard", qty: 5 },
    ]);
  });

  it("keeps different tiers of the same part apart", () => {
    const merged = mergeScrapParts([
      [{ partId: "body", tier: "Epic", qty: 1 }],
      [{ partId: "body", tier: "Legendary", qty: 1 }],
    ]);
    expect(merged).toEqual([
      { partId: "body", tier: "Legendary", qty: 1 },
      { partId: "body", tier: "Epic", qty: 1 },
    ]);
  });
});

describe("BOM coverage", () => {
  it("authors a BOM for every guitar definition", () => {
    const missing = GUITAR_DEFINITIONS.filter(
      (g) => GUITAR_BOMS[Number(g.id)] === undefined,
    );
    expect(missing.map((g) => g.id)).toEqual([]);
  });

  it("authors a BOM for every effect type in use", () => {
    const missing = EFFECT_DEFINITIONS.filter(
      (e) => getEffectBom(e.id, e.type).length === 0,
    );
    expect(missing.map((e) => e.id)).toEqual([]);
    expect(Object.keys(EFFECT_BOM_BY_TYPE).length).toBeGreaterThan(0);
  });

  it("only references known part ids", () => {
    const boms = [
      ...GUITAR_DEFINITIONS.map((g) => getGuitarBom(g.id)),
      ...EFFECT_DEFINITIONS.map((e) => getEffectBom(e.id, e.type)),
    ];
    for (const bom of boms) {
      for (const slot of bom) {
        expect(PARTS_BY_ID.has(slot.partId)).toBe(true);
      }
    }
  });

  it("lists no part twice in one BOM", () => {
    const boms = [
      ...GUITAR_DEFINITIONS.map((g) => getGuitarBom(g.id)),
      ...EFFECT_DEFINITIONS.map((e) => getEffectBom(e.id, e.type)),
    ];
    for (const bom of boms) {
      const ids = bom.map((s) => s.partId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("yields something for every guitar and effect in the pool", () => {
    for (const g of GUITAR_DEFINITIONS) {
      expect(
        getScrapYield({ bom: getGuitarBom(g.id), rarity: g.rarity }).length,
      ).toBeGreaterThan(0);
    }
    for (const e of EFFECT_DEFINITIONS) {
      expect(
        getScrapYield({ bom: getEffectBom(e.id, e.type), rarity: e.rarity })
          .length,
      ).toBeGreaterThan(0);
    }
  });

  it("agrees with the published slot counts", () => {
    expect(Math.max(...Object.values(RARITY_SLOT_COUNT))).toBe(4);
  });
});
