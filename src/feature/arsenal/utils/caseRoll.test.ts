import { describe, expect, it } from "vitest";

import { CASE_DEFINITIONS } from "../data/caseDefinitions";
import { EFFECTS_BY_RARITY } from "../data/effectDefinitions";
import { DROPPABLE_GUITARS_BY_RARITY } from "../data/guitarDefinitions";
import type { CasePityCounters, GuitarRarity } from "../types/arsenal.types";
import { canDiscoverNew, GUITAR_CHANCE, rollGearDrop } from "./caseRoll";
import { mulberry32 } from "./seededRandom";

type Id = number | string;

const allIds = (pools: Record<string, readonly { id: Id }[] | undefined>) =>
  Object.values(pools).flatMap((pool) => (pool ?? []).map((item) => item.id));

const ALL_GUITARS = new Set<Id>(allIds(DROPPABLE_GUITARS_BY_RARITY));
const ALL_EFFECTS = new Set<Id>(allIds(EFFECTS_BY_RARITY));

/** Everything discovered except the listed ids. */
const without = (all: ReadonlySet<Id>, ...missing: Id[]) => {
  const seen = new Set(all);
  for (const id of missing) seen.delete(id);
  return seen;
};

const DRAWS = 400;

const draws = (
  caseId: string,
  options: {
    guitars?: ReadonlySet<Id>;
    effects?: ReadonlySet<Id>;
    counters?: CasePityCounters;
    packGuarantee?: { newModel: boolean; minRarity?: GuitarRarity };
    seed?: number;
    count?: number;
  } = {},
) => {
  const random = mulberry32(options.seed ?? 1);
  return Array.from({ length: options.count ?? DRAWS }, () =>
    rollGearDrop({
      caseDef: CASE_DEFINITIONS[caseId],
      discoveredGuitars: options.guitars ?? new Set(),
      discoveredEffects: options.effects ?? new Set(),
      counters: options.counters,
      packGuarantee: options.packGuarantee,
      random,
    }),
  );
};

const FRESH: CasePityCounters = { sinceNew: 0, sinceTop: 0 };

describe("which pool a case draws from", () => {
  it("keeps a guitar case on guitars and an effects case on pedals", () => {
    expect(draws("elite-guitar").every((d) => d.kind === "guitar")).toBe(true);
    expect(draws("premium-effect").every((d) => d.kind === "effect")).toBe(
      true,
    );
    expect(draws("vault-guitar").every((d) => d.kind === "guitar")).toBe(true);
    expect(draws("vault-effect").every((d) => d.kind === "effect")).toBe(true);
  });

  it("splits a mixed case at GUITAR_CHANCE", () => {
    const results = draws("standard", { count: 4000 });
    const share =
      results.filter((d) => d.kind === "guitar").length / results.length;
    expect(share).toBeCloseTo(GUITAR_CHANCE, 1);
  });

  it("only ever drops a rarity the case's table prints", () => {
    for (const id of [
      "standard",
      "premium-guitar",
      "elite-effect",
      "vault-guitar",
    ]) {
      const odds = CASE_DEFINITIONS[id].probabilities;
      for (const drop of draws(id)) {
        expect(
          odds[drop.rarity as keyof typeof odds] ?? 0,
          `${id} ${drop.rarity}`,
        ).toBeGreaterThan(0);
      }
    }
  });
});

describe("the new-model guarantee", () => {
  const due: CasePityCounters = { sinceNew: 1, sinceTop: 0 };
  // The one Epic guitar still missing — Elite can reach it, so the guarantee can pay.
  const missing = DROPPABLE_GUITARS_BY_RARITY.Epic![0].id;

  it("hands over the one model still missing when it comes due", () => {
    const results = draws("elite-guitar", {
      guitars: without(ALL_GUITARS, missing),
      counters: due,
    });
    for (const drop of results) {
      expect(drop.def.id).toBe(missing);
      expect(drop.pityHit).toBe("new");
    }
  });

  it("does not claim a guarantee before it is due", () => {
    // The ordinary re-roll still steers these pulls toward the missing Epic —
    // that is the existing rule — but none of them is the counter's doing.
    const results = draws("elite-guitar", {
      guitars: without(ALL_GUITARS, missing),
      counters: FRESH,
    });
    expect(results.every((d) => d.pityHit === undefined)).toBe(true);
    expect(results.some((d) => d.def.id !== missing)).toBe(true);
  });

  it("flips a mixed case to the kind that still has something new", () => {
    const standardDue: CasePityCounters = { sinceNew: 3, sinceTop: 0 };
    const missingEffect = EFFECTS_BY_RARITY.Common![0].id;
    const results = draws("standard", {
      guitars: ALL_GUITARS,
      effects: without(ALL_EFFECTS, missingEffect),
      counters: standardDue,
    });
    for (const drop of results) {
      expect(drop.kind).toBe("effect");
      expect(drop.def.id).toBe(missingEffect);
    }
  });

  it("will not reach past the re-roll ceiling to keep a promise", () => {
    // Only a Mythic is missing. Honouring the guarantee would make the Standard
    // case a route to a Mythic that is cheaper than the cases built to sell one.
    const missingMythic = DROPPABLE_GUITARS_BY_RARITY.Mythic![0].id;
    const results = draws("premium-guitar", {
      guitars: without(ALL_GUITARS, missingMythic),
      counters: { sinceNew: 2, sinceTop: 0 },
      count: 2000,
    });
    const mythics = results.filter((d) => d.rarity === "Mythic").length;
    expect(mythics / results.length).toBeLessThan(0.05);
    expect(results.every((d) => d.pityHit === undefined)).toBe(true);
  });

  it("skips a guarantee nothing can pay and rolls an ordinary pull", () => {
    const results = draws("elite-guitar", {
      guitars: ALL_GUITARS,
      counters: due,
    });
    expect(results.every((d) => d.pityHit === undefined)).toBe(true);
    expect(new Set(results.map((d) => d.rarity)).size).toBeGreaterThan(1);
  });
});

describe("the top-rarity guarantee", () => {
  it("makes Elite hand over Legendary or better when it comes due", () => {
    const results = draws("elite-guitar", {
      counters: { sinceNew: 0, sinceTop: 7 },
    });
    for (const drop of results) {
      expect(["Legendary", "Mythic"]).toContain(drop.rarity);
      expect(drop.pityHit).toBe("top");
    }
    // …in the proportions the card prints, not all of one.
    const rarities = new Set(results.map((d) => d.rarity));
    expect(rarities.size).toBe(2);
  });

  it("makes the Vault hand over a Mythic after 9 misses", () => {
    const results = draws("vault-effect", {
      counters: { sinceNew: 0, sinceTop: 9 },
    });
    expect(results.every((d) => d.rarity === "Mythic")).toBe(true);
    expect(results.every((d) => d.pityHit === "top")).toBe(true);
  });

  it("does not trigger one open early", () => {
    const results = draws("vault-guitar", {
      counters: { sinceNew: 0, sinceTop: 8 },
    });
    expect(results.some((d) => d.rarity !== "Mythic")).toBe(true);
    expect(results.every((d) => d.pityHit === undefined)).toBe(true);
  });

  it("pays both guarantees with one pull when it can", () => {
    // One Legendary missing: the top guarantee picks the rarity, and the
    // new-model guarantee picks the model within it.
    const missing = DROPPABLE_GUITARS_BY_RARITY.Legendary![0].id;
    const results = draws("elite-guitar", {
      guitars: without(ALL_GUITARS, missing),
      counters: { sinceNew: 1, sinceTop: 7 },
    });
    for (const drop of results) {
      expect(drop.def.id).toBe(missing);
      expect(drop.pityHit).toBe("top");
    }
  });
});

describe("the pack guarantee", () => {
  it("owes the last open of a pack a model the player has never held", () => {
    const missing = DROPPABLE_GUITARS_BY_RARITY.Common![0].id;
    const results = draws("standard", {
      guitars: without(ALL_GUITARS, missing),
      effects: ALL_EFFECTS,
      packGuarantee: { newModel: true, minRarity: "Rare" },
    });
    for (const drop of results) {
      expect(drop.kind).toBe("guitar");
      expect(drop.def.id).toBe(missing);
    }
  });

  it("falls back to a rarity floor when nothing new is within reach", () => {
    const results = draws("standard", {
      guitars: ALL_GUITARS,
      effects: ALL_EFFECTS,
      packGuarantee: { newModel: true, minRarity: "Rare" },
    });
    const order: GuitarRarity[] = [
      "Common",
      "Uncommon",
      "Rare",
      "Epic",
      "Legendary",
      "Mythic",
    ];
    for (const drop of results) {
      expect(order.indexOf(drop.rarity)).toBeGreaterThanOrEqual(
        order.indexOf("Rare"),
      );
    }
    // The floor redistributes the printed odds; it does not collapse them.
    expect(new Set(results.map((d) => d.rarity)).size).toBeGreaterThan(1);
  });

  it("adds nothing when the pack has no guarantee to pay", () => {
    const results = draws("standard", {
      guitars: ALL_GUITARS,
      effects: ALL_EFFECTS,
    });
    expect(results.some((d) => d.rarity === "Common")).toBe(true);
  });
});

describe("canDiscoverNew", () => {
  it("is true while the case can still reach something the player has not held", () => {
    expect(
      canDiscoverNew(CASE_DEFINITIONS["elite-guitar"], new Set(), new Set()),
    ).toBe(true);
  });

  it("is false once everything the case can reach is in the Dex", () => {
    expect(
      canDiscoverNew(CASE_DEFINITIONS["elite-guitar"], ALL_GUITARS, new Set()),
    ).toBe(false);
  });

  it("looks at the pool the case actually draws from", () => {
    // Every guitar held, no pedal held: an effects case still has plenty to find.
    expect(
      canDiscoverNew(CASE_DEFINITIONS["elite-effect"], ALL_GUITARS, new Set()),
    ).toBe(true);
    expect(
      canDiscoverNew(CASE_DEFINITIONS["elite-effect"], new Set(), ALL_EFFECTS),
    ).toBe(false);
  });

  it("asks both pools for a mixed case", () => {
    expect(
      canDiscoverNew(CASE_DEFINITIONS.standard, ALL_GUITARS, new Set()),
    ).toBe(true);
    expect(
      canDiscoverNew(CASE_DEFINITIONS.standard, ALL_GUITARS, ALL_EFFECTS),
    ).toBe(false);
  });

  it("ignores a model only the chase tiers hold, which the re-roll ceiling walls off", () => {
    const missingMythic = DROPPABLE_GUITARS_BY_RARITY.Mythic![0].id;
    expect(
      canDiscoverNew(
        CASE_DEFINITIONS["premium-guitar"],
        without(ALL_GUITARS, missingMythic),
        new Set(),
      ),
    ).toBe(false);
  });
});
