import type { ChordUnit } from "../types/boss.types";
import type { BossFightState } from "./bossEngine";
import { createFight } from "./bossEngine";
import { dealUnits } from "./chordPhaseGenerator";
import type {
  Affix,
  ChordPhasePlan,
  PhasePlan,
  PhaseRules,
} from "./phaseGenerator";

/** Test fixtures: a fight whose first phase has known numbers and threats. */
export const FIXTURE_SEED = 1234;

export const FIXTURE_RULES: PhaseRules = {
  bossHp: 100,
  biteDamage: 10,
  chargeMax: 9,
  slamEvery: 1000,
  slamWindup: 5,
  venomNotes: 4,
  regenAfter: 2,
  regenPerNote: 2,
  weakSpotEvery: 1000,
  weakSpotLength: 3,
  webEvery: 1000,
  webLength: 4,
};

export const fightWith = (
  rules: Partial<PhaseRules> = {},
  threats: Partial<Pick<PhasePlan, "slams" | "weakSpots" | "affixes">> = {},
): BossFightState => {
  const base = createFight(FIXTURE_SEED);
  const plan: PhasePlan = {
    ...base.plan,
    slams: false,
    weakSpots: false,
    affixes: [],
    ...threats,
    rules: { ...FIXTURE_RULES, ...rules },
  };
  return {
    ...base,
    plan,
    bossHp: plan.rules.bossHp,
    bossMaxHp: plan.rules.bossHp,
    chargeMax: plan.rules.chargeMax,
    notesToSlam: plan.rules.slamEvery,
    slamWindup: plan.rules.slamWindup,
    notesToWeakSpot: plan.rules.weakSpotEvery,
    notesToWeb: plan.rules.webEvery,
  };
};

/**
 * A colossus fight on a known pass: by default G C D G at half notes, then a
 * two-bar quake of C D G C D G C D in quarters — strums 4 to 11.
 */
export const FIXTURE_UNITS: ChordUnit[] = dealUnits(["G", "C", "D"], 2, 4, [2]);

export const chordFightWith = (
  rules: Partial<PhaseRules> = {},
  options: {
    units?: ChordUnit[];
    weakSpots?: boolean;
    affixes?: Affix[];
    weakChange?: string | null;
  } = {},
): BossFightState => {
  const base = createFight(FIXTURE_SEED, "chords");
  if (base.plan.kind !== "chords") throw new Error("not a chord fight");
  const units = options.units ?? FIXTURE_UNITS;
  const plan: ChordPhasePlan = {
    ...base.plan,
    slams: false,
    quakes: units.some((unit) => unit.quake),
    weakSpots: options.weakSpots ?? false,
    affixes: options.affixes ?? [],
    variation: {
      ...base.plan.variation,
      // The fixture pass is dealt in half notes.
      beatsPerChord: 2,
      units,
      progression: [...new Set(units.map((unit) => unit.chord))],
    },
    rules: { ...FIXTURE_RULES, slamEvery: 0, slamWindup: 0, ...rules },
  };
  return {
    ...base,
    plan,
    weakChange: options.weakChange ?? null,
    bossHp: plan.rules.bossHp,
    bossMaxHp: plan.rules.bossHp,
    chargeMax: plan.rules.chargeMax,
    notesToWeb: plan.rules.webEvery,
  };
};
