import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { describe, expect, it } from "vitest";

import type {
  EffectInventoryItem,
  InventoryItem,
  RigSetup,
} from "../types/arsenal.types";
import { EFFECT_DEFINITIONS } from "./effectDefinitions";
import { GUITAR_DEFINITIONS } from "./guitarDefinitions";
import type { RigItem, TraitSessionContext } from "./traitEval";
import {
  buildRigTraitContext,
  evaluateRigTraits,
  getRigTraitCategoryRates,
  getRigTraitPayout,
  getRigTraitShowcaseRate,
  getTraitCardState,
  getTraitUnits,
  SKILL_CATEGORY,
  toTraitBlocks,
} from "./traitEval";
import type { TraitCondition, TraitDef } from "./traits";
import {
  getTraitSlots,
  isTraitEligible,
  rollItemTraits,
  TRAIT_CHANCE,
  TRAIT_DEFINITIONS,
  TRAITS_BY_ID,
} from "./traits";

/**
 * A skill needs this many exercises behind it before a trait may name it.
 *
 * The floor exists because of the rule it enforces: a condition nobody can meet
 * is worse than no condition, since the card still advertises it. Four is where
 * the real data falls off a cliff — `transcription` and `composition` have one
 * exercise each and `audio_production` has two, so a trait naming any of them
 * would hang on a single row of content surviving forever.
 */
const SKILL_MIN_EXERCISES = 4;

/** Deterministic generator so slot and value rolls can be pinned exactly. */
const seeded = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Always rolls the same number — the cleanest way to force or block a slot. */
const fixed = (value: number) => () => value;

const def = (id: string): TraitDef => TRAITS_BY_ID.get(id)!;

const skillCoverage = (): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const exercise of exercisesAgregat)
    for (const skill of exercise.relatedSkills ?? [])
      counts[skill] = (counts[skill] ?? 0) + 1;
  return counts;
};

const walkConditions = (
  cond: TraitCondition | undefined,
  visit: (c: TraitCondition) => void,
): void => {
  if (!cond) return;
  visit(cond);
  if (cond.type === "all") cond.of.forEach((c) => walkConditions(c, visit));
};

// ─── Rule 9: nothing on this table may be unsatisfiable ──────────────────────

describe("trait satisfiability", () => {
  it("only names skills that real exercises train", () => {
    const coverage = skillCoverage();
    for (const trait of TRAIT_DEFINITIONS)
      walkConditions(trait.condition, (cond) => {
        if (cond.type !== "skills") return;
        for (const skill of cond.skills)
          expect(
            coverage[skill] ?? 0,
            `${trait.id} names "${skill}", which has ${coverage[skill] ?? 0} exercises`,
          ).toBeGreaterThanOrEqual(SKILL_MIN_EXERCISES);
      });
  });

  it("only gates on effect types that exist", () => {
    const types = new Set(EFFECT_DEFINITIONS.map((e) => e.type));
    for (const trait of TRAIT_DEFINITIONS) {
      for (const type of trait.appliesTo ?? [])
        expect(types.has(type), `${trait.id} applies to ${type}`).toBe(true);
      walkConditions(trait.condition, (cond) => {
        if (cond.type !== "board-has-types") return;
        for (const type of cond.types)
          expect(types.has(type), `${trait.id} wants ${type} on the board`).toBe(
            true,
          );
      });
    }
  });

  it("rolls {brand} only from brands with enough models to satisfy it", () => {
    const guitarBrands = GUITAR_DEFINITIONS.reduce<Record<string, number>>(
      (acc, g) => {
        acc[g.brand] = (acc[g.brand] ?? 0) + 1;
        return acc;
      },
      {},
    );

    for (const trait of TRAIT_DEFINITIONS) {
      if (!trait.brandParam) continue;
      // Every branded trait must be able to draw at least one brand, and a
      // whole-rig brand condition needs a brand with three models behind it.
      const rolls = Array.from({ length: 60 }, (_, i) =>
        rollItemTraits(
          trait.minRarity ?? "Mythic",
          trait.kind,
          trait.appliesTo?.[0],
          seeded(i + 1),
        ),
      )
        .flatMap((t) => t ?? [])
        .filter((t) => t.id === trait.id);

      for (const roll of rolls) {
        const brand = roll.params?.brand;
        expect(brand, `${trait.id} rolled without a brand`).toBeTruthy();
        if (trait.kind === "guitar")
          expect(
            guitarBrands[brand!] ?? 0,
            `${trait.id} rolled ${brand}, which has ${guitarBrands[brand!] ?? 0} models`,
          ).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("never caps a counter above what the game can supply", () => {
    // 3 guitar slots; the board is uncapped but a rig of 6+ pedals is the
    // practical top of what any build assembles.
    const reachable: Record<string, number> = {
      "brand-items": 3,
      "board-pedals": 8,
      "other-guitars": 2,
      "items-before-year": 8,
      "board-rarity": 8,
      "other-build-levels": 999,
      "other-traits": 3 * 2 + 8 * 2 - 1,
    };
    for (const trait of TRAIT_DEFINITIONS) {
      if (!trait.counter) continue;
      expect(
        trait.counter.cap,
        `${trait.id} caps at ${trait.counter.cap}`,
      ).toBeLessThanOrEqual(reachable[trait.counter.type]);
    }
  });

  it("gives every rarity something it can roll", () => {
    for (const rarity of [
      "Common",
      "Uncommon",
      "Rare",
      "Epic",
      "Legendary",
      "Mythic",
    ] as const) {
      const guitars = TRAIT_DEFINITIONS.filter((t) =>
        isTraitEligible(t, "guitar", rarity),
      );
      expect(guitars.length, `no guitar traits for ${rarity}`).toBeGreaterThan(0);
    }
  });

  it("keeps SKILL_CATEGORY in step with the skill tree", () => {
    for (const skill of guitarSkills)
      expect(SKILL_CATEGORY[skill.id], `${skill.id} missing`).toBe(
        skill.category,
      );
  });
});

// ─── Rolling ─────────────────────────────────────────────────────────────────

describe("rolling traits", () => {
  it("gives one slot below Epic and two from Epic up", () => {
    expect(getTraitSlots("Common")).toBe(1);
    expect(getTraitSlots("Rare")).toBe(1);
    expect(getTraitSlots("Epic")).toBe(2);
    expect(getTraitSlots("Mythic")).toBe(2);
    expect(getTraitSlots("Custom Shop")).toBe(2);
  });

  it("drops nothing when every slot rolls over the chance", () => {
    expect(rollItemTraits("Mythic", "guitar", undefined, fixed(0.9))).toBeUndefined();
  });

  it("fills both Epic slots when every roll passes, with distinct traits", () => {
    // 0.01 clears the 20% gate; the value roll then lands on each trait's floor.
    const traits = rollItemTraits("Epic", "guitar", undefined, fixed(0.01));
    expect(traits).toHaveLength(2);
    expect(traits![0].id).not.toBe(traits![1].id);
  });

  it("never exceeds one trait below Epic", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const traits = rollItemTraits("Rare", "guitar", undefined, seeded(seed));
      expect((traits ?? []).length).toBeLessThanOrEqual(1);
    }
  });

  it("rolls roughly one item in five with a trait", () => {
    let withTrait = 0;
    const runs = 4000;
    for (let seed = 1; seed <= runs; seed++)
      if (rollItemTraits("Rare", "guitar", undefined, seeded(seed))) withTrait++;
    // One slot at TRAIT_CHANCE, so the rate is the chance itself.
    expect(withTrait / runs).toBeGreaterThan(TRAIT_CHANCE - 0.04);
    expect(withTrait / runs).toBeLessThan(TRAIT_CHANCE + 0.04);
  });

  it("keeps every rolled value inside its trait's range", () => {
    for (let seed = 1; seed <= 800; seed++)
      for (const rarity of ["Rare", "Epic", "Legendary", "Mythic"] as const)
        for (const trait of rollItemTraits(
          rarity,
          "guitar",
          undefined,
          seeded(seed),
        ) ?? []) {
          const rolled = TRAITS_BY_ID.get(trait.id)!;
          expect(trait.value).toBeGreaterThanOrEqual(rolled.min);
          expect(trait.value).toBeLessThanOrEqual(rolled.max);
        }
  });

  it("keeps the three empty-board tiers in their own rarity windows", () => {
    expect(isTraitEligible(def("straight-to-amp"), "guitar", "Rare")).toBe(true);
    expect(isTraitEligible(def("straight-to-amp"), "guitar", "Legendary")).toBe(
      false,
    );
    expect(isTraitEligible(def("cable-and-amp"), "guitar", "Epic")).toBe(false);
    expect(isTraitEligible(def("cable-and-amp"), "guitar", "Legendary")).toBe(
      true,
    );
    expect(isTraitEligible(def("nothing-but-the-guitar"), "guitar", "Legendary")).toBe(
      false,
    );
    expect(isTraitEligible(def("nothing-but-the-guitar"), "guitar", "Mythic")).toBe(
      true,
    );
  });

  it("only offers a pedal the traits its type can carry", () => {
    expect(isTraitEligible(def("ear-trainer"), "effect", "Rare", "Delay")).toBe(
      true,
    );
    expect(isTraitEligible(def("ear-trainer"), "effect", "Rare", "Fuzz")).toBe(
      false,
    );
  });
});

// ─── Evaluation ──────────────────────────────────────────────────────────────

const session = (
  minutes: Partial<TraitSessionContext["minutes"]>,
  skills: string[] = [],
): TraitSessionContext => ({
  minutes: {
    technique: 0,
    theory: 0,
    hearing: 0,
    creativity: 0,
    ...minutes,
  },
  skills,
});

const guitar = (over: Partial<RigItem> = {}): RigItem => ({
  itemId: "g1",
  kind: "guitar",
  brand: "Fairmont",
  rarity: "Epic",
  buildLevel: 0,
  traits: [],
  ...over,
});

const pedal = (over: Partial<RigItem> = {}): RigItem => ({
  itemId: "p1",
  kind: "effect",
  brand: "Forge",
  rarity: "Rare",
  effectType: "Delay",
  buildLevel: 0,
  traits: [],
  x: 50,
  ...over,
});

describe("time blocks", () => {
  it("rounds practice down to whole quarter-hours", () => {
    expect(toTraitBlocks(14)).toBe(0);
    expect(toTraitBlocks(15)).toBe(15);
    expect(toTraitBlocks(44)).toBe(30);
    expect(toTraitBlocks(60)).toBe(60);
  });

  it("pays nothing for a session under one block", () => {
    const rig = {
      guitars: [guitar({ traits: [{ id: "workhorse", value: 3 }] })],
      pedals: [],
    };
    expect(getRigTraitPayout(rig, session({ technique: 14 })).fame).toBe(0);
  });
});

describe("clocks", () => {
  it("pays a category trait only for its own category", () => {
    const rig = {
      guitars: [guitar({ traits: [{ id: "shred-machine", value: 6 }] })],
      pedals: [],
    };
    // 30 min technique of a 60 min session: half an hour at 6 Fame/h.
    expect(
      getRigTraitPayout(rig, session({ technique: 30, theory: 30 })).fame,
    ).toBe(3);
  });

  it("pays a session trait for the whole session", () => {
    const rig = {
      guitars: [guitar({ traits: [{ id: "workhorse", value: 3 }] })],
      pedals: [],
    };
    expect(
      getRigTraitPayout(rig, session({ technique: 30, theory: 30 })).fame,
    ).toBe(3);
  });
});

describe("category rates", () => {
  it("bills a category trait to its own category only", () => {
    const rig = {
      guitars: [guitar({ traits: [{ id: "shred-machine", value: 6 }] })],
      pedals: [],
    };
    expect(getRigTraitCategoryRates(rig)).toEqual({
      technique: 6,
      theory: 0,
      hearing: 0,
      creativity: 0,
    });
  });

  it("bills a session trait to every category", () => {
    const rig = {
      guitars: [guitar({ traits: [{ id: "workhorse", value: 3 }] })],
      pedals: [],
    };
    expect(getRigTraitCategoryRates(rig)).toEqual({
      technique: 3,
      theory: 3,
      hearing: 3,
      creativity: 3,
    });
  });

  // The panel shows both numbers side by side, so they have to be allowed to
  // disagree: `Monk` wants the whole session in one category, which is true of
  // all four columns here and of no even hour.
  it("shows a single-category trait the even hour cannot", () => {
    const rig = {
      guitars: [guitar({ traits: [{ id: "monk", value: 80 }] })],
      pedals: [],
    };
    expect(getRigTraitCategoryRates(rig).technique).toBe(80);
    expect(getRigTraitShowcaseRate(rig)).toBe(0);
  });
});

describe("conditions", () => {
  it("pays a board condition only while the board matches", () => {
    const traits = [{ id: "wants-dirt", value: 8 }];
    const withDirt = {
      guitars: [guitar({ traits })],
      pedals: [pedal({ effectType: "Overdrive" })],
    };
    const withoutDirt = { guitars: [guitar({ traits })], pedals: [] };

    expect(getRigTraitPayout(withDirt, session({ technique: 60 })).fame).toBe(8);
    expect(getRigTraitPayout(withoutDirt, session({ technique: 60 })).fame).toBe(
      0,
    );
  });

  it("requires every skill a multi-skill trait names", () => {
    const rig = {
      guitars: [guitar({ rarity: "Legendary", traits: [{ id: "virtuoso", value: 40 }] })],
      pedals: [],
    };
    const all = session({ technique: 60 }, [
      "alternate_picking",
      "legato",
      "sweep_picking",
    ]);
    const partial = session({ technique: 60 }, ["alternate_picking", "legato"]);

    expect(getRigTraitPayout(rig, all).fame).toBe(40);
    expect(getRigTraitPayout(rig, partial).fame).toBe(0);
  });

  it("reads chain order from board positions", () => {
    const fuzz = pedal({
      itemId: "fuzz",
      effectType: "Fuzz",
      x: 80,
      traits: [{ id: "front-of-chain", value: 6 }],
    });
    const drive = pedal({ itemId: "od", effectType: "Overdrive", x: 30 });

    expect(
      getRigTraitPayout(
        { guitars: [guitar()], pedals: [fuzz, drive] },
        session({ technique: 60 }),
      ).fame,
    ).toBe(6);

    // Same board, fuzz moved behind the drive: the rule it was paid for is gone.
    expect(
      getRigTraitPayout(
        { guitars: [guitar()], pedals: [{ ...fuzz, x: 10 }, drive] },
        session({ technique: 60 }),
      ).fame,
    ).toBe(0);
  });

  it("does not count the carrier as its own second drive", () => {
    const od = pedal({
      itemId: "od",
      effectType: "Overdrive",
      traits: [{ id: "gain-stack", value: 6 }],
    });
    expect(
      getRigTraitPayout(
        { guitars: [guitar()], pedals: [od] },
        session({ technique: 60 }),
      ).fame,
    ).toBe(0);
    expect(
      getRigTraitPayout(
        { guitars: [guitar()], pedals: [od, pedal({ itemId: "d2", effectType: "Distortion" })] },
        session({ technique: 60 }),
      ).fame,
    ).toBe(6);
  });
});

describe("counters", () => {
  it("multiplies by the units in service and stops at the cap", () => {
    const carrier = guitar({
      traits: [{ id: "brand-endorsement", value: 3, params: { brand: "Fairmont" } }],
    });
    const two = {
      guitars: [carrier, guitar({ itemId: "g2", brand: "Fairmont" })],
      pedals: [],
    };
    expect(getRigTraitPayout(two, session({ technique: 60 })).fame).toBe(6);

    const four = {
      guitars: [
        carrier,
        guitar({ itemId: "g2", brand: "Fairmont" }),
        guitar({ itemId: "g3", brand: "Fairmont" }),
        guitar({ itemId: "g4", brand: "Fairmont" }),
      ],
      pedals: [],
    };
    // Capped at three even with a fourth in service.
    expect(getRigTraitPayout(four, session({ technique: 60 })).fame).toBe(9);
  });

  it("excludes the carrier's own trait from Well Equipped", () => {
    const carrier = pedal({
      itemId: "p1",
      traits: [{ id: "well-equipped", value: 2 }],
    });
    const other = guitar({ traits: [{ id: "workhorse", value: 3 }] });
    const { entries } = getRigTraitPayout(
      { guitars: [other], pedals: [carrier] },
      session({ technique: 60 }),
    );
    expect(entries.find((e) => e.def.id === "well-equipped")!.rate).toBe(2);
  });
});

describe("amplifiers and penalties", () => {
  it("adds a flat rate to the traits it matches and none to itself", () => {
    const boost = pedal({
      itemId: "boost",
      effectType: "Boost",
      traits: [{ id: "signal-booster", value: 2 }],
    });
    const delay = pedal({
      itemId: "delay",
      effectType: "Delay",
      traits: [{ id: "ear-trainer", value: 5 }],
    });
    const { entries } = getRigTraitPayout(
      { guitars: [guitar()], pedals: [boost, delay] },
      session({ hearing: 60 }),
    );

    expect(entries.find((e) => e.def.id === "signal-booster")!.rate).toBe(0);
    expect(entries.find((e) => e.def.id === "ear-trainer")!.rate).toBe(7);
  });

  it("pays Patchbay only into pedals further down the chain than itself", () => {
    const patchbay = pedal({
      itemId: "patchbay",
      x: 50,
      traits: [{ id: "patchbay", value: 2 }],
    });
    const neighbour = (x: number) =>
      pedal({ itemId: "neighbour", x, traits: [{ id: "workhorse", value: 3 }] });
    const rateOf = (x: number) =>
      getRigTraitPayout(
        { guitars: [guitar()], pedals: [patchbay, neighbour(x)] },
        session({ technique: 60 }),
      ).entries.find((e) => e.def.id === "workhorse")!.rate;

    // The chain runs right to left, so a neighbour further left is downstream.
    expect(rateOf(10)).toBe(5);
    // Same board, the neighbour dragged to the other side: the amp stops reaching it.
    expect(rateOf(80)).toBe(3);
  });

  it("lets Prima Donna silence every other trait in the rig", () => {
    const rig = {
      guitars: [
        guitar({ rarity: "Mythic", traits: [{ id: "prima-donna", value: 100 }] }),
        guitar({ itemId: "g2", traits: [{ id: "workhorse", value: 3 }] }),
      ],
      pedals: [pedal({ traits: [{ id: "ear-trainer", value: 5 }] })],
    };
    const { entries, fame } = getRigTraitPayout(rig, session({ hearing: 60 }));

    expect(entries.find((e) => e.def.id === "workhorse")!.rate).toBe(0);
    expect(entries.find((e) => e.def.id === "ear-trainer")!.rate).toBe(0);
    expect(fame).toBe(100);
  });

  it("docks other traits for Diva but never below zero", () => {
    const rig = {
      guitars: [
        guitar({ rarity: "Legendary", traits: [{ id: "diva", value: 60 }] }),
        guitar({ itemId: "g2", traits: [{ id: "workhorse", value: 3 }] }),
      ],
      pedals: [],
    };
    const { entries } = getRigTraitPayout(rig, session({ technique: 60 }));

    expect(entries.find((e) => e.def.id === "diva")!.rate).toBe(60);
    // 3 − 9 would be negative; a trait that stops paying is the floor.
    expect(entries.find((e) => e.def.id === "workhorse")!.rate).toBe(0);
  });

  it("counts an unmet trait as inactive and pays it nothing", () => {
    const rig = {
      guitars: [guitar({ traits: [{ id: "wants-dirt", value: 8 }] })],
      pedals: [],
    };
    const entry = evaluateRigTraits(rig, session({ technique: 60 }))[0];
    expect(entry.active).toBe(false);
    expect(entry.rate).toBe(0);
  });
});

// ─── Card state ──────────────────────────────────────────────────────────────

describe("card state", () => {
  const rigWith = (pedals: RigItem[], guitars: RigItem[]) => ({
    guitars,
    pedals,
  });

  it("calls an unconditional trait met", () => {
    const self = guitar({ traits: [{ id: "workhorse", value: 3 }] });
    expect(
      getTraitCardState(
        def("workhorse"),
        { id: "workhorse", value: 3 },
        self,
        rigWith([], [self]),
      ),
    ).toBe("met");
  });

  it("marks a rig condition unmet while the gear is wrong", () => {
    const self = guitar({ traits: [{ id: "wants-dirt", value: 8 }] });
    expect(
      getTraitCardState(
        def("wants-dirt"),
        { id: "wants-dirt", value: 8 },
        self,
        rigWith([], [self]),
      ),
    ).toBe("unmet");
    // Purely a rig condition, so satisfying the board settles it outright —
    // there is nothing left for the session to decide.
    expect(
      getTraitCardState(
        def("wants-dirt"),
        { id: "wants-dirt", value: 8 },
        self,
        rigWith([pedal({ effectType: "Fuzz" })], [self]),
      ),
    ).toBe("met");
  });

  it("reports a pure session condition as session, not as a failure", () => {
    const self = guitar({ traits: [{ id: "picking-bench", value: 10 }] });
    expect(
      getTraitCardState(
        def("picking-bench"),
        { id: "picking-bench", value: 10 },
        self,
        rigWith([], [self]),
      ),
    ).toBe("session");
  });

  it("does not light a counter that currently counts nothing", () => {
    // The bug this pins: `Boutique Row` has no condition, only a counter, and a
    // trait with no condition used to report `met` unconditionally — so a Common
    // tuner on a board without a single Epic pedal advertised a rate it was
    // paying none of.
    const self = pedal({
      rarity: "Common",
      effectType: "Tuner",
      traits: [{ id: "boutique-row", value: 2 }],
    });
    const raw = { id: "boutique-row", value: 2 };

    expect(getTraitCardState(def("boutique-row"), raw, self, rigWith([self], []))).toBe(
      "unmet",
    );

    const boutique = pedal({ itemId: "p2", rarity: "Epic", effectType: "Delay" });
    expect(
      getTraitCardState(
        def("boutique-row"),
        raw,
        self,
        rigWith([self, boutique], []),
      ),
    ).toBe("met");
  });

  it("reports the units a lit counter is multiplied by", () => {
    const self = guitar({ traits: [{ id: "pedal-platform", value: 1.5 }] });
    const rig = rigWith(
      [pedal({ itemId: "p1" }), pedal({ itemId: "p2" })],
      [self],
    );
    expect(
      getTraitUnits(def("pedal-platform"), { id: "pedal-platform", value: 1.5 }, self, rig),
    ).toBe(2);
  });

  it("stays unmet while the rig half of a mixed condition is wrong", () => {
    const self = guitar({ traits: [{ id: "metal-rig", value: 20 }] });
    expect(
      getTraitCardState(
        def("metal-rig"),
        { id: "metal-rig", value: 20 },
        self,
        rigWith([pedal({ effectType: "Overdrive" })], [self]),
      ),
    ).toBe("unmet");
  });
});

// ─── Building the context from stored data ───────────────────────────────────

describe("buildRigTraitContext", () => {
  it("takes only gear in service, and keeps board positions", () => {
    const equipped: InventoryItem = {
      id: "g1",
      guitarId: GUITAR_DEFINITIONS[0].id,
      acquiredAt: 0,
      isNew: false,
      year: 2000,
      country: "USA",
      traits: [{ id: "workhorse", value: 3 }],
    };
    const stashed: InventoryItem = { ...equipped, id: "g2" };
    const boarded: EffectInventoryItem = {
      id: "p1",
      effectId: EFFECT_DEFINITIONS[0].id,
      acquiredAt: 0,
      isNew: false,
    };
    const rig: RigSetup = {
      guitarSlots: ["g1", null, null],
      pedalboardItems: [{ itemId: "p1", xPct: 30, yPct: 50 }],
      ampHeadId: null,
      ampId: null,
    };

    const ctx = buildRigTraitContext({
      rig,
      inventory: [equipped, stashed],
      effectInventory: [boarded],
    });

    expect(ctx.guitars.map((g) => g.itemId)).toEqual(["g1"]);
    expect(ctx.pedals[0].x).toBe(30);
  });

  it("survives an empty or missing arsenal", () => {
    expect(buildRigTraitContext(null)).toEqual({ guitars: [], pedals: [] });
  });

  it("ignores traits on items whose definition has been retired", () => {
    const rig = {
      guitars: [guitar({ traits: [{ id: "no-such-trait", value: 99 }] })],
      pedals: [],
    };
    expect(getRigTraitPayout(rig, session({ technique: 60 })).fame).toBe(0);
  });
});
