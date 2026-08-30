import { describe, expect, it } from "vitest";

import type { GuitarDefinition, GuitarRarity } from "../types/arsenal.types";
import { GUITAR_DEFINITIONS, GUITARS_BY_ID } from "./guitarDefinitions";
import {
  getEligibleMods,
  getPromotionsAvailable,
  GUITAR_FEATURES,
  RARITY_LADDER,
  RARITY_MAX_FEATURES,
  rollItemFeatures,
} from "./itemStats";

const guitar = (id: number): GuitarDefinition => {
  const def = GUITARS_BY_ID.get(id);
  if (!def)
    throw new Error(`No guitar ${id} — the roster moved under this test`);
  return def as GuitarDefinition;
};

const modsOn = (id: number): string[] =>
  getEligibleMods(guitar(id).spec).map((m) => m.id);

/** The best rarity this model can ever reach, promotions included. */
const maxRarity = (mintRarity: GuitarRarity): GuitarRarity =>
  RARITY_LADDER[
    RARITY_LADDER.indexOf(mintRarity) + getPromotionsAvailable(mintRarity)
  ];

describe("guitar specs — the roster", () => {
  it("classifies every guitar", () => {
    for (const def of GUITAR_DEFINITIONS) {
      expect(def.spec, `guitar ${def.id} (${def.name})`).toBeDefined();
    }
  });

  /**
   * The invariant that keeps a restriction from quietly starving a build.
   *
   * Mod slots come from rarity, eligible mods from the spec, and the two are
   * authored in different files — so a new rule can shrink a pool below the slots
   * an instrument can open without anything else complaining. The resonator sits
   * exactly on this line: 13 mods against the 13 slots a Rare reaches at Mythic.
   */
  it("leaves every guitar enough mods to fill the slots it can reach", () => {
    for (const def of GUITAR_DEFINITIONS) {
      const slots = RARITY_MAX_FEATURES[maxRarity(def.rarity)];
      const eligible = getEligibleMods(def.spec).length;

      expect(
        eligible,
        `${def.name} #${def.id} can open ${slots} slots but only ${eligible} mods fit it`,
      ).toBeGreaterThanOrEqual(slots);
    }
  });

  it("keeps every mod in the pool fittable somewhere", () => {
    // A mod nothing can take is dead stock: the trader would still sell it and the
    // market would still list it, and no instrument in the game could use it.
    for (const mod of GUITAR_FEATURES) {
      const fits = GUITAR_DEFINITIONS.some((def) =>
        getEligibleMods(def.spec).some((m) => m.id === mod.id),
      );

      expect(fits, `${mod.label} fits no guitar in the roster`).toBe(true);
    }
  });
});

describe("guitar specs — the rules", () => {
  it("puts a tremolo block only on a guitar with a tremolo", () => {
    expect(modsOn(24)).toContain("brass-trem-block"); // Stratocaster
    expect(modsOn(16)).toContain("brass-trem-block"); // Floyd superstrat
    expect(modsOn(40)).toContain("brass-trem-block"); // PRS vibrato

    expect(modsOn(20)).not.toContain("brass-trem-block"); // Telecaster
    expect(modsOn(42)).not.toContain("brass-trem-block"); // Les Paul
    expect(modsOn(11)).not.toContain("brass-trem-block"); // Flying V
    expect(modsOn(1)).not.toContain("brass-trem-block"); // headless
    expect(modsOn(46)).not.toContain("brass-trem-block"); // floating offset
  });

  it("splits a coil only where there is a humbucker", () => {
    expect(modsOn(42)).toContain("coil-split"); // Les Paul, HH
    expect(modsOn(16)).toContain("coil-split"); // superstrat, HSH

    expect(modsOn(24)).not.toContain("coil-split"); // Strat, SSS
    expect(modsOn(20)).not.toContain("coil-split"); // Telecaster, SS
    expect(modsOn(62)).not.toContain("coil-split"); // Osprey, P90s
  });

  it("leaves a Floyd its own nut and saddles", () => {
    expect(modsOn(16)).not.toContain("bone-nut");
    expect(modsOn(16)).not.toContain("steel-saddles");

    expect(modsOn(24)).toContain("bone-nut");
    expect(modsOn(24)).toContain("steel-saddles");
  });

  it("chambers only a solid body", () => {
    expect(modsOn(24)).toContain("chambered-body");
    expect(modsOn(3)).not.toContain("chambered-body"); // semi-hollow already
    expect(modsOn(26)).not.toContain("chambered-body"); // resonator
  });

  it("locks tuners only where there is a headstock", () => {
    expect(modsOn(42)).toContain("locking-tuners"); // set-neck, still has one
    expect(modsOn(1)).not.toContain("locking-tuners"); // headless
  });

  it("does no electrical work on an instrument with no harness", () => {
    const resonator = modsOn(26);

    for (const id of [
      "coil-split",
      "hand-wound",
      "push-pull",
      "phase-switch",
      "treble-bleed",
      "cts-pots",
      "pio-caps",
      "active-preamp",
      "copper-shielding",
    ]) {
      expect(resonator, `resonator should not take ${id}`).not.toContain(id);
    }
  });

  it("does fretwork and setup on everything", () => {
    for (const def of GUITAR_DEFINITIONS) {
      const ids = getEligibleMods(def.spec).map((m) => m.id);

      expect(ids, `${def.name} #${def.id}`).toContain("fret-level");
      expect(ids, `${def.name} #${def.id}`).toContain("stainless-frets");
      expect(ids, `${def.name} #${def.id}`).toContain("compound-radius");
    }
  });
});

describe("rollItemFeatures", () => {
  it("never mints a mod the guitar cannot physically take", () => {
    // The bug this whole gate exists for: a Les Paul minting with a tremolo block.
    const lesPaul = guitar(42);
    const eligible = new Set(getEligibleMods(lesPaul.spec).map((m) => m.id));

    for (let i = 0; i < 300; i++) {
      const rolled = rollItemFeatures(lesPaul);
      for (const f of rolled?.features ?? []) {
        expect(eligible, `rolled ${f.id} on a ${lesPaul.name}`).toContain(f.id);
      }
    }
  });

  it("still fills a restricted instrument up to its slot count", () => {
    // Always-fill RNG: every slot takes, so this is the ceiling, not an average.
    const resonator = guitar(26);
    const rolled = rollItemFeatures(resonator, () => 0);

    expect(rolled?.features.length).toBe(RARITY_MAX_FEATURES[resonator.rarity]);
  });
});
