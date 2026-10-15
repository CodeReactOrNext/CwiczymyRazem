import { COMPONENT_DEFS } from "feature/guitarBuilder/data/components";
import { describe, expect, it } from "vitest";

import type { CaseDefinition, GuitarRarity } from "../types/arsenal.types";
import { isAtLeast } from "../utils/pity";
import { CASE_DEFINITIONS, CASE_PACK_SIZES } from "./caseDefinitions";
import { EFFECTS_BY_RARITY } from "./effectDefinitions";
import { GUITARS_BY_RARITY } from "./guitarDefinitions";

const CASES = Object.entries(CASE_DEFINITIONS);

/** Rarest first — the order the ladder is argued about in. */
const RARITIES: Exclude<GuitarRarity, "Custom Shop">[] = [
  "Mythic",
  "Legendary",
  "Epic",
  "Rare",
  "Uncommon",
  "Common",
];

/** The cases that hand out gear: everything on the shelf except the Parts Crate. */
const GEAR_CASES = CASES.filter(([, def]) => def.dropKind !== "component");

const epicOrBetter = (probs: CaseDefinition["probabilities"]) =>
  (probs.Epic ?? 0) + (probs.Legendary ?? 0) + (probs.Mythic ?? 0);

describe("case probability tables", () => {
  it.each(CASES)("%s sums to exactly 1", (_id, def) => {
    // `drawRarity` walks the table accumulating until the roll is covered and
    // silently returns Common if it never is. A table summing to 0.99 would
    // therefore hand 1% of pulls to Common — including on the Elite cases,
    // which advertise that Common cannot drop at all.
    const total = Object.values(def.probabilities).reduce(
      (sum, p) => sum + (p ?? 0),
      0,
    );

    expect(total).toBeCloseTo(1, 10);
  });

  it.each(CASES)("%s never states a negative chance", (_id, def) => {
    for (const p of Object.values(def.probabilities)) {
      expect(p ?? 0).toBeGreaterThanOrEqual(0);
    }
  });

  it.each(CASES)(
    "%s can actually deliver every rarity it advertises",
    (_id, def) => {
      // A non-zero chance pointing at an empty pool is a table that lies: the draw
      // falls through to the Common pool and the player gets something else.
      for (const rarity of RARITIES) {
        if ((def.probabilities[rarity] ?? 0) === 0) continue;

        const guitars = GUITARS_BY_RARITY[rarity]?.length ?? 0;
        const effects = EFFECTS_BY_RARITY[rarity]?.length ?? 0;
        const parts = COMPONENT_DEFS.filter((c) => c.rarity === rarity).length;

        if (def.dropKind === "component") expect(parts).toBeGreaterThan(0);
        else if (def.dropKind === "guitar") expect(guitars).toBeGreaterThan(0);
        else if (def.dropKind === "effect") expect(effects).toBeGreaterThan(0);
        else expect(guitars + effects).toBeGreaterThan(0);
      }
    },
  );

  it("keeps every paid gear tier strictly better than the Standard case", () => {
    // The ladder's whole promise: paying more never lowers your odds at the top
    // end. Checked cumulatively — "Epic or better" — because a case is allowed
    // to trade Legendary for Mythic, but never to trade both away.
    const standard = CASE_DEFINITIONS.standard;

    for (const [id, def] of GEAR_CASES) {
      if (id === "standard") continue;
      expect(epicOrBetter(def.probabilities), id).toBeGreaterThan(
        epicOrBetter(standard.probabilities),
      );
      expect(def.fameCost, id).toBeGreaterThan(standard.fameCost);
    }
  });
});

describe("the shelf's price ladder", () => {
  const cost = (id: string) => CASE_DEFINITIONS[id].fameCost;

  it("climbs from Standard to the vault without a tie, the crate among them", () => {
    const ladder = [
      "standard",
      "daily",
      "parts",
      "premium-guitar",
      "supporter",
      "elite-guitar",
      "vault-guitar",
    ];
    for (let i = 1; i < ladder.length; i++) {
      expect(
        cost(ladder[i]),
        `${ladder[i]} over ${ladder[i - 1]}`,
      ).toBeGreaterThan(cost(ladder[i - 1]));
    }
  });

  it("prices a pedal case exactly like its guitar twin", () => {
    // One card, one price: the switch on the shelf changes the pool, never the bill.
    for (const tier of ["premium", "elite", "vault"]) {
      expect(cost(`${tier}-effect`)).toBe(cost(`${tier}-guitar`));
      expect(CASE_DEFINITIONS[`${tier}-effect`].probabilities).toEqual(
        CASE_DEFINITIONS[`${tier}-guitar`].probabilities,
      );
    }
  });

  it("makes the vault a decision, not a default", () => {
    // Saved for, not clicked through: more than twice the Elite case.
    expect(cost("vault-guitar")).toBeGreaterThan(cost("elite-guitar") * 2);
  });

  it("improves the odds at every chase tier from Rare up, rung by rung", () => {
    const rungs = ["standard", "premium-guitar", "elite-guitar"];
    for (let i = 1; i < rungs.length; i++) {
      const lower = CASE_DEFINITIONS[rungs[i - 1]].probabilities;
      const higher = CASE_DEFINITIONS[rungs[i]].probabilities;
      for (const rarity of ["Rare", "Epic", "Legendary", "Mythic"] as const) {
        expect(
          higher[rarity],
          `${rungs[i]} ${rarity} over ${rungs[i - 1]}`,
        ).toBeGreaterThan(lower[rarity]);
      }
    }
  });
});

describe("what a case drops", () => {
  it("hands out parts from the Parts Crate and nowhere else", () => {
    expect(CASE_DEFINITIONS.parts.dropKind).toBe("component");
    for (const [id, def] of GEAR_CASES) {
      expect(def.dropKind, id).not.toBe("component");
    }
  });

  it("gives the Parts Crate no pity — there is no collection to complete", () => {
    expect(CASE_DEFINITIONS.parts.pity).toBeUndefined();
  });

  it("makes the vault Epic or better, every time", () => {
    for (const id of ["vault-guitar", "vault-effect"]) {
      const probs = CASE_DEFINITIONS[id].probabilities;
      expect(probs.Common + probs.Uncommon + probs.Rare).toBe(0);
      expect(epicOrBetter(probs)).toBeCloseTo(1, 10);
    }
  });

  it("keeps free cases off the vault and nowhere else", () => {
    // A token is worth the same on any shelf that takes it: priced past what one
    // is worth, the vault must not take one.
    for (const [id, def] of CASES) {
      expect(Boolean(def.noFreeCase), id).toBe(id.startsWith("vault"));
    }
  });
});

describe("pity rules", () => {
  const WITH_PITY = CASES.filter(([, def]) => def.pity);

  it("sits on every gear case that completes a collection, and only there", () => {
    // Curated cases already never repeat while their pool holds something new,
    // and the Parts Crate has no Dex.
    for (const id of ["daily", "supporter", "parts"]) {
      expect(CASE_DEFINITIONS[id].pity, id).toBeUndefined();
    }
    for (const id of [
      "standard",
      "premium-guitar",
      "premium-effect",
      "elite-guitar",
      "elite-effect",
      "vault-guitar",
      "vault-effect",
    ]) {
      expect(CASE_DEFINITIONS[id].pity, id).toBeDefined();
    }
  });

  it.each(WITH_PITY)("%s only promises what it can keep", (_id, def) => {
    // A guarantee longer than one open, and a top rarity the table really drops.
    if (def.pity?.newWithin)
      expect(def.pity.newWithin).toBeGreaterThanOrEqual(2);
    if (def.pity?.top) {
      expect(def.pity.top.within).toBeGreaterThanOrEqual(2);
      expect(
        epicOrBetter(def.probabilities) > 0 &&
          RARITIES.some(
            (rarity) =>
              isAtLeast(rarity, def.pity!.top!.rarity) &&
              (def.probabilities[rarity] ?? 0) > 0,
          ),
      ).toBe(true);
    }
  });

  it("shortens the new-model wait on every rung up the ladder", () => {
    const wait = (id: string) => CASE_DEFINITIONS[id].pity!.newWithin!;
    expect(wait("standard")).toBeGreaterThan(wait("premium-guitar"));
    expect(wait("premium-guitar")).toBeGreaterThan(wait("elite-guitar"));
  });

  it("keeps a pedal case's guarantees equal to its guitar twin's", () => {
    for (const tier of ["premium", "elite", "vault"]) {
      expect(CASE_DEFINITIONS[`${tier}-effect`].pity).toEqual(
        CASE_DEFINITIONS[`${tier}-guitar`].pity,
      );
    }
  });

  it("never lets a case promise a top rarity rarer than its own best roll", () => {
    // The Vault's Mythic guarantee is the only one that asks for the very top.
    expect(CASE_DEFINITIONS["vault-guitar"].pity?.top?.rarity).toBe("Mythic");
    expect(CASE_DEFINITIONS["elite-guitar"].pity?.top?.rarity).toBe(
      "Legendary",
    );
  });
});

describe("packs", () => {
  it("offers a handful of sizes, every one a real multiple", () => {
    expect(CASE_PACK_SIZES.length).toBeGreaterThan(0);
    for (const size of CASE_PACK_SIZES) {
      expect(Number.isInteger(size)).toBe(true);
      expect(size).toBeGreaterThan(1);
    }
  });
});
