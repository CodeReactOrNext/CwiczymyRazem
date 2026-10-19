import type { BossFightState } from "./bossEngine";
import { createFight } from "./bossEngine";
import type { PhasePlan, PhaseRules } from "./phaseGenerator";

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
