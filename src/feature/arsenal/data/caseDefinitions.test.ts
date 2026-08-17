import { describe, expect, it } from "vitest";

import type { GuitarRarity } from "../types/arsenal.types";
import { CASE_DEFINITIONS } from "./caseDefinitions";
import { EFFECTS_BY_RARITY } from "./effectDefinitions";
import { GUITARS_BY_RARITY } from "./guitarDefinitions";

const CASES = Object.entries(CASE_DEFINITIONS);

/** Rarest first — the order the ladder is argued about in. */
const RARITIES: GuitarRarity[] = [
  "Mythic",
  "Legendary",
  "Epic",
  "Rare",
  "Uncommon",
  "Common",
];

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

  it.each(CASES)("%s can actually deliver every rarity it advertises", (_id, def) => {
    // A non-zero chance pointing at an empty pool is a table that lies: the draw
    // falls through to the Common pool and the player gets something else.
    for (const rarity of RARITIES) {
      if ((def.probabilities[rarity] ?? 0) === 0) continue;

      const guitars = GUITARS_BY_RARITY[rarity]?.length ?? 0;
      const effects = EFFECTS_BY_RARITY[rarity]?.length ?? 0;

      if (def.dropKind === "guitar") expect(guitars).toBeGreaterThan(0);
      else if (def.dropKind === "effect") expect(effects).toBeGreaterThan(0);
      else expect(guitars + effects).toBeGreaterThan(0);
    }
  });

  it("keeps every paid tier strictly better than the Standard case", () => {
    // The ladder's whole promise: paying more never lowers your odds at the top
    // end. Checked cumulatively — "Epic or better" — because a case is allowed
    // to trade Legendary for Mythic, but never to trade both away.
    const standard = CASE_DEFINITIONS.standard;
    const epicOrBetter = (probs: (typeof standard)["probabilities"]) =>
      (probs.Epic ?? 0) + (probs.Legendary ?? 0) + (probs.Mythic ?? 0);

    for (const [id, def] of CASES) {
      if (id === "standard") continue;
      expect(epicOrBetter(def.probabilities)).toBeGreaterThan(
        epicOrBetter(standard.probabilities),
      );
      expect(def.fameCost).toBeGreaterThan(standard.fameCost);
    }
  });
});
