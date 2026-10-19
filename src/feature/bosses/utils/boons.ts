import { AFFIX_FROM, createRng, SLAMS_FROM, WEAK_SPOTS_FROM } from "./phaseGenerator";

/**
 * Upgrades the player drafts between phases, one of three dealt at random —
 * the roguelike half of the fight. Each adds a stack; `max` caps how many.
 */
export type BoonId =
  | "armor"
  | "shield"
  | "vitality"
  | "bandage"
  | "lifesteal"
  | "thorns"
  | "secondWind"
  | "steadyHand"
  | "antidote"
  | "clearSight"
  | "blade"
  | "lightBlade"
  | "precision"
  | "momentum"
  | "exploit"
  | "slowDown"
  | "overdrive";

export type BoonRarity = "common" | "rare" | "epic";

export interface BoonDef {
  id: BoonId;
  rarity: BoonRarity;
  /** Stacks a run can hold; past it the card is no longer dealt. */
  max: number;
  /** 1-based phase from which it is dealt — no antidote before there is venom. */
  from?: number;
}

/** Every number a boon uses, shared by the engine and the card text. */
export const BOON = {
  armorCut: 0.25,
  shieldCharges: 3,
  vitalityHp: 20,
  bandageHp: 35,
  lifestealHp: 2,
  thornsShare: 0.02,
  secondWindMisses: 2,
  steadyHandStreak: 2,
  clearSightShare: 0.5,
  bladeBonus: 0.2,
  lightBladeCut: 0.2,
  precisionPoints: 6,
  momentumStreak: 24,
  exploitCharge: 3,
  exploitLength: 1.5,
  slowDownBpm: 5,
  overdriveBpm: 10,
  overdriveDamage: 1.4,
} as const;

export const BOONS: readonly BoonDef[] = [
  { id: "armor", rarity: "common", max: 3 },
  { id: "shield", rarity: "common", max: 99 },
  { id: "bandage", rarity: "common", max: 99 },
  { id: "blade", rarity: "common", max: 3 },
  { id: "slowDown", rarity: "common", max: 3 },
  { id: "vitality", rarity: "rare", max: 3 },
  { id: "lifesteal", rarity: "rare", max: 3 },
  { id: "thorns", rarity: "rare", max: 2 },
  { id: "secondWind", rarity: "rare", max: 2 },
  { id: "lightBlade", rarity: "rare", max: 2 },
  { id: "precision", rarity: "rare", max: 1 },
  { id: "steadyHand", rarity: "rare", max: 1, from: SLAMS_FROM },
  { id: "antidote", rarity: "rare", max: 1, from: AFFIX_FROM - 1 },
  { id: "clearSight", rarity: "rare", max: 1, from: AFFIX_FROM - 1 },
  { id: "momentum", rarity: "epic", max: 1 },
  { id: "exploit", rarity: "epic", max: 1, from: WEAK_SPOTS_FROM },
  { id: "overdrive", rarity: "epic", max: 2 },
];

const WEIGHT: Record<BoonRarity, number> = { common: 6, rare: 3, epic: 1 };

export const boonDef = (id: BoonId) => BOONS.find((b) => b.id === id)!;

export type BoonStacks = Partial<Record<BoonId, number>>;

export const stacksOf = (boons: BoonStacks, id: BoonId) => boons[id] ?? 0;

/** Cards dealt per draft. */
export const DRAFT_SIZE = 3;

/**
 * Three different boons for the draft before 1-based phase `phase`, drawn by
 * rarity weight from those the run can still take. The same run, phase and
 * reroll always deal the same cards.
 */
export const dealDraft = (
  runSeed: number,
  phase: number,
  boons: BoonStacks,
  reroll = 0,
): BoonId[] => {
  const rng = createRng((runSeed ^ Math.imul(phase * 31 + reroll + 7, 0x85ebca6b)) >>> 0);
  let pool = BOONS.filter((b) => stacksOf(boons, b.id) < b.max && (b.from ?? 1) <= phase);
  const dealt: BoonId[] = [];
  while (dealt.length < DRAFT_SIZE && pool.length) {
    const total = pool.reduce((sum, b) => sum + WEIGHT[b.rarity], 0);
    let roll = rng() * total;
    const pick = pool.find((b) => (roll -= WEIGHT[b.rarity]) < 0) ?? pool[pool.length - 1];
    dealt.push(pick.id);
    pool = pool.filter((b) => b.id !== pick.id);
  }
  return dealt;
};

/** Tempo the boons put on every phase from now on: slower, or faster for power. */
export const boonBpmShift = (boons: BoonStacks) =>
  stacksOf(boons, "overdrive") * BOON.overdriveBpm - stacksOf(boons, "slowDown") * BOON.slowDownBpm;

/** The run's build, biggest stacks first — for the arena and the verdict. */
export const buildOf = (boons: BoonStacks): { id: BoonId; stacks: number }[] =>
  BOONS.filter((b) => stacksOf(boons, b.id) > 0)
    .map((b) => ({ id: b.id, stacks: stacksOf(boons, b.id) }))
    .sort((a, b) => b.stacks - a.stacks);

/** The threat a boon answers — the draft says so when that threat is on. */
export const BOON_COUNTERS: Partial<Record<BoonId, "slams" | "weak_spots" | "venom" | "web">> = {
  steadyHand: "slams",
  exploit: "weak_spots",
  antidote: "venom",
  clearSight: "web",
};

/** Boons that work well together — the draft points out pairs with the build. */
export const BOON_SYNERGIES: Partial<Record<BoonId, readonly BoonId[]>> = {
  armor: ["shield", "thorns", "vitality"],
  shield: ["armor", "thorns"],
  vitality: ["armor", "lifesteal"],
  lifesteal: ["lightBlade", "vitality"],
  thorns: ["armor", "shield"],
  secondWind: ["momentum"],
  blade: ["lightBlade", "overdrive", "momentum"],
  lightBlade: ["blade", "lifesteal", "precision"],
  precision: ["lightBlade", "exploit"],
  momentum: ["blade", "secondWind"],
  exploit: ["precision"],
  // Overdrive's tempo, slowed back down — and its ×1.4 stays.
  slowDown: ["overdrive"],
  overdrive: ["blade", "slowDown"],
};

/** Boons in the build a card would pair with. */
export const synergiesWith = (id: BoonId, boons: BoonStacks) =>
  (BOON_SYNERGIES[id] ?? []).filter((other) => stacksOf(boons, other) > 0);
