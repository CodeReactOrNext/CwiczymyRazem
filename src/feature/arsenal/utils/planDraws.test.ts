import { describe, expect, it, vi } from "vitest";

import { CASE_DEFINITIONS } from "../data/caseDefinitions";
import { getDailyPool } from "../data/dailyCase";
import { EFFECTS_BY_RARITY } from "../data/effectDefinitions";
import { DROPPABLE_GUITARS_BY_RARITY } from "../data/guitarDefinitions";
import type { CasePityCounters } from "../types/arsenal.types";
import { advancePity, isAtLeast } from "./pity";
import { planDraws } from "./planDraws";
import { mulberry32 } from "./seededRandom";

type Id = number | string;

const ids = (pools: Record<string, readonly { id: Id }[] | undefined>) =>
  Object.values(pools).flatMap((pool) => (pool ?? []).map((item) => item.id));

const ALL_GUITARS = ids(DROPPABLE_GUITARS_BY_RARITY);
const ALL_EFFECTS = ids(EFFECTS_BY_RARITY);

const FRESH: CasePityCounters = { sinceNew: 0, sinceTop: 0 };

const plan = (
  caseId: string,
  count: number,
  options: {
    guitars?: Iterable<Id>;
    effects?: Iterable<Id>;
    counters?: CasePityCounters;
    curated?: boolean;
    seed?: number;
    rollPart?: () => string;
  } = {},
) => {
  const discoveredGuitars = new Set<Id>(options.guitars ?? []);
  const discoveredEffects = new Set<Id>(options.effects ?? []);
  const result = planDraws({
    caseDef: CASE_DEFINITIONS[caseId],
    count,
    discoveredGuitars,
    discoveredEffects,
    counters: options.counters,
    curatedPool: options.curated ? getDailyPool() : null,
    rollPart: options.rollPart ?? (() => "part"),
    random: mulberry32(options.seed ?? 1),
  });
  return { ...result, discoveredGuitars, discoveredEffects };
};

describe("planDraws: the shape of a request", () => {
  it("makes exactly as many draws as it was asked for", () => {
    for (const count of [1, 5, 10]) {
      expect(plan("elite-guitar", count).draws).toHaveLength(count);
    }
  });

  it("adds every model it draws to what the account has found", () => {
    const { draws, discoveredGuitars } = plan("elite-guitar", 10);
    const drawn = new Set(
      draws.flatMap((d) => (d.kind === "guitar" ? [d.def.id] : [])),
    );
    expect(discoveredGuitars).toEqual(drawn);
  });

  it("keeps a guitar case on guitars and a pedal case on pedals", () => {
    expect(
      plan("vault-guitar", 10).draws.every((d) => d.kind === "guitar"),
    ).toBe(true);
    expect(
      plan("vault-effect", 10).draws.every((d) => d.kind === "effect"),
    ).toBe(true);
  });
});

describe("planDraws: the opens see each other", () => {
  it("never calls a model new twice in one pack", () => {
    // The second copy of a model drawn on the third open is a duplicate by the
    // fifth: that is what makes the merge offer on it true.
    for (let seed = 1; seed <= 60; seed++) {
      const { draws } = plan("premium-guitar", 10, { seed });
      const flaggedNew = draws.flatMap((d) =>
        d.kind !== "component" && d.isNew ? [d.def.id] : [],
      );
      expect(new Set(flaggedNew).size).toBe(flaggedNew.length);
    }
  });

  it("calls a model new only if the account did not already hold it", () => {
    const held = ALL_GUITARS.slice(0, 40);
    const { draws } = plan("standard", 10, {
      guitars: held,
      effects: ALL_EFFECTS,
    });
    for (const draw of draws) {
      if (draw.kind === "guitar" && held.includes(draw.def.id)) {
        expect(draw.isNew).toBe(false);
      }
    }
  });

  it("moves the pity counters open by open, as separate requests would have", () => {
    const def = CASE_DEFINITIONS["elite-guitar"];
    const { draws, counters } = plan("elite-guitar", 10, { counters: FRESH });

    // Replayed by hand from the outcomes: the plan must agree at every step.
    let expected = FRESH;
    for (const draw of draws) {
      if (draw.kind === "component") continue;
      expected = advancePity(def, expected, {
        isNew: draw.isNew,
        rarity: draw.rarity,
      });
      expect(draw.pityAfter).toEqual(expected);
    }
    expect(counters).toEqual(expected);
  });

  it("starts from the counters it was given", () => {
    // Owed a Legendary or better on the very first open of the pack.
    const { draws } = plan("elite-guitar", 1, {
      counters: { sinceNew: 0, sinceTop: 7 },
    });
    const [first] = draws;
    expect(first.kind !== "component" && first.pityHit).toBe("top");
  });
});

describe("planDraws: the pack guarantee", () => {
  it("never lets a pack of a fully-collected pool come back without a Rare or better", () => {
    // Everything found, so nothing can be new: the last open falls back to its
    // rarity floor. Without that, one pack in ten of Standard would be all repeats.
    for (let seed = 1; seed <= 200; seed++) {
      const { draws } = plan("standard", 5, {
        guitars: ALL_GUITARS,
        effects: ALL_EFFECTS,
        seed,
      });
      expect(
        draws.some(
          (d) => d.kind !== "component" && isAtLeast(d.rarity, "Rare"),
        ),
      ).toBe(true);
    }
  });

  it("does not apply to a single open", () => {
    const rarities = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const { draws } = plan("standard", 1, {
        guitars: ALL_GUITARS,
        effects: ALL_EFFECTS,
        seed,
      });
      for (const d of draws) if (d.kind !== "component") rarities.add(d.rarity);
    }
    expect(rarities.has("Common")).toBe(true);
  });

  it("owes the last open of a pack a model that is new, when there is one in reach", () => {
    // One Epic guitar missing and nothing else: a pack of Elite cases has to
    // contain it, whatever the first four opens did.
    const missing = DROPPABLE_GUITARS_BY_RARITY.Epic![0].id;
    const held = ALL_GUITARS.filter((id) => id !== missing);
    for (let seed = 1; seed <= 100; seed++) {
      const { draws } = plan("elite-guitar", 5, { guitars: held, seed });
      expect(
        draws.some((d) => d.kind === "guitar" && d.def.id === missing),
      ).toBe(true);
    }
  });
});

describe("planDraws: the cases that are not the plain gear ones", () => {
  it("makes a Parts Crate pack of parts only, and touches nothing found", () => {
    const rollPart = vi.fn(() => "a part");
    const { draws, counters, discoveredGuitars, discoveredEffects } = plan(
      "parts",
      5,
      { rollPart },
    );

    expect(rollPart).toHaveBeenCalledTimes(5);
    expect(draws.every((d) => d.kind === "component")).toBe(true);
    expect(counters).toBeUndefined();
    expect(discoveredGuitars.size + discoveredEffects.size).toBe(0);
  });

  it("draws a curated case from its pool and nowhere else", () => {
    const pool = getDailyPool();
    const poolIds = new Set(
      pool.map((entry) => `${entry.kind}-${entry.def.id}`),
    );

    const { draws } = plan("daily", 10, { curated: true });
    for (const draw of draws) {
      if (draw.kind === "component")
        throw new Error("a part from a curated case");
      expect(poolIds.has(`${draw.kind}-${draw.def.id}`)).toBe(true);
    }
  });

  it("carries no pity for a case that has none", () => {
    const { draws, counters } = plan("daily", 5, { curated: true });

    expect(counters).toBeUndefined();
    expect(draws.every((d) => d.kind === "component" || !d.pityAfter)).toBe(
      true,
    );
  });
});
