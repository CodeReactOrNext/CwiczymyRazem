import type { GuitarRarity } from "feature/arsenal/types/arsenal.types";
import type { LockedFeatureId } from "feature/levelGate/data/featureUnlocks";
import { FEATURE_UNLOCK_LIST } from "feature/levelGate/data/featureUnlocks";
import type { PartSlot } from "lib/rewards/rewardPayout";

import { getRaritiesUnlockedAt, RARITY_UNLOCK_LVL } from "./rarityCap";

/**
 * What a level hands over.
 *
 * Deliberately not a `RewardPayout`: levels pay in *things* — salvage, free
 * cases, loose mods — and never in Fame. Fame is the wallet the Arsenal spends,
 * and a ladder that topped it up would quietly turn practice time into a price
 * list. Parts and mods have no exchange rate back into anything else, so they
 * can only ever be used for the thing they are for, which is building the rig
 * the level just widened.
 *
 * Points are out for the same reason they are out of `RewardPayout`: they rank
 * the leaderboard, and a level that paid points would pay for the next level.
 */
export interface LevelPayout {
  /** Free cases. One opens anything on the shelf without spending Fame. */
  caseTokens: number;
  /** Salvage slots, drawn on claim — see `rollLevelReward`. */
  parts: PartSlot[];
  /** Loose mods, drawn on claim from the workshop pool. */
  mods: number;
}

export type MilestoneUnlock =
  | { kind: "rarity"; rarity: GuitarRarity }
  | { kind: "feature"; feature: LockedFeatureId };

export interface LevelMilestone {
  lvl: number;
  /** What opens at this level. Empty on a level that only pays. */
  unlocks: MilestoneUnlock[];
  /** What it pays. Null on a level that only opens something. */
  payout: LevelPayout | null;
}

/**
 * What each level pays, and nothing else — the unlocks are derived below from
 * the two places that already own them, so a rarity threshold or a gated page
 * can never say one thing here and another thing where it is enforced.
 *
 * The curve is restrained on purpose. Everything on this ladder is collected
 * once, ever, while the daily case pays out every day forever; the ladder is
 * meant to mark the climb, not to become the main way anybody stocks a stash.
 * Across all eleven rungs — roughly the first eighty hours of practice — it
 * comes to seven free cases, five mods and sixteen parts.
 */
const LEVEL_PAYOUTS: Record<number, LevelPayout> = {
  3: { caseTokens: 0, parts: [{ tier: "Standard", qty: 2 }], mods: 0 },
  5: { caseTokens: 1, parts: [], mods: 0 },
  6: { caseTokens: 0, parts: [{ tier: "Epic", qty: 2 }], mods: 0 },
  8: { caseTokens: 0, parts: [], mods: 1 },
  10: { caseTokens: 1, parts: [{ tier: "Epic", qty: 3 }], mods: 0 },
  12: { caseTokens: 0, parts: [], mods: 1 },
  15: { caseTokens: 1, parts: [{ tier: "Legendary", qty: 2 }], mods: 0 },
  18: { caseTokens: 0, parts: [], mods: 1 },
  20: { caseTokens: 1, parts: [{ tier: "Legendary", qty: 3 }], mods: 0 },
  25: { caseTokens: 2, parts: [], mods: 1 },
  28: { caseTokens: 1, parts: [{ tier: "Legendary", qty: 4 }], mods: 1 },
};

/** The ledger id a claimed level is recorded under. One per level, forever. */
export const levelRewardId = (lvl: number): string => `level_${lvl}`;

/**
 * The last level the ladder is defined for.
 *
 * Far past anywhere anybody will stand. A level costs `2×lvl + 34` points and
 * practice pays 22 an hour, so level 1000 is somewhere north of forty thousand
 * hours; the number is here to make the ladder finite, not to be reached. What
 * it buys is that no account can ever climb off the end of it and find the
 * screen empty, which is what used to happen at 28.
 */
export const MAX_LEVEL = 1000;

/** Where the hand-written table stops and the curve takes over. */
const AUTHORED_TOP = Math.max(...Object.keys(LEVEL_PAYOUTS).map(Number));

/**
 * What a level past the authored table pays.
 *
 * Every one of them pays something, which the early ladder deliberately does
 * not: level 4 is minutes after level 3, and a reward every few minutes is
 * confetti. Out here a single level is `2×lvl + 34` points — four hours of
 * practice at level 30, ten at level 100 — so a level *is* the occasion, and
 * one that passed unmarked would read as the ladder having quietly ended.
 *
 * Parts stop at Legendary because that is the highest tier a part can actually
 * roll: `PartSlot` excludes Unique, and `partsAtTier("Unique")` would draw from
 * an empty pool. So the climb past here is paid in quantity and in the cadence
 * of cases and mods, not in a tier that does not exist.
 *
 * The rates are deliberately behind the cost curve. Parts grow every forty
 * levels while the price of a level grows every level, so an hour of practice
 * at level 300 buys strictly less than an hour at level 30 — the ladder keeps
 * marking the climb without ever becoming the reason to make it.
 */
const generatedPayout = (lvl: number): LevelPayout => ({
  // Every fifth level, doubling on the twenty-fifths — the round numbers a
  // player already counts towards.
  caseTokens: lvl % 25 === 0 ? 2 : lvl % 5 === 0 ? 1 : 0,
  parts: [{ tier: "Legendary", qty: Math.min(10, 2 + Math.floor(lvl / 40)) }],
  mods: lvl % 20 === 0 ? 2 : lvl % 4 === 0 ? 1 : 0,
});

/**
 * What a level pays, anywhere on the ladder — the one place that answers it.
 *
 * The authored table wins wherever it has an entry, so the tuned early curve is
 * untouched; its *gaps* win too, which is why the generated curve only starts
 * once the table is finished rather than filling in behind it.
 */
export const levelPayout = (lvl: number): LevelPayout | null => {
  if (!Number.isInteger(lvl) || lvl < 2 || lvl > MAX_LEVEL) return null;
  if (LEVEL_PAYOUTS[lvl]) return LEVEL_PAYOUTS[lvl];
  if (lvl <= AUTHORED_TOP) return null;
  return generatedPayout(lvl);
};

const buildLadder = (): LevelMilestone[] => {
  const levels = new Set<number>([
    ...Object.keys(LEVEL_PAYOUTS).map(Number),
    ...Object.values(RARITY_UNLOCK_LVL),
    ...FEATURE_UNLOCK_LIST.map((feature) => feature.requiredLvl),
    // Every level past the authored table gets a rung of its own, so the climb
    // ahead is never empty however far somebody has come.
    ...Array.from(
      { length: MAX_LEVEL - AUTHORED_TOP },
      (_, i) => AUTHORED_TOP + 1 + i,
    ),
  ]);

  return [...levels]
    .filter((lvl) => lvl > 1)
    .sort((a, b) => a - b)
    .map((lvl) => ({
      lvl,
      unlocks: [
        ...getRaritiesUnlockedAt(lvl).map(
          (rarity): MilestoneUnlock => ({ kind: "rarity", rarity }),
        ),
        ...FEATURE_UNLOCK_LIST.filter(
          (feature) => feature.requiredLvl === lvl,
        ).map(
          (feature): MilestoneUnlock => ({
            kind: "feature",
            feature: feature.id,
          }),
        ),
      ],
      payout: levelPayout(lvl),
    }));
};

/**
 * The whole ladder, ascending.
 *
 * Built once from its sources rather than typed out, so adding a rarity
 * threshold or gating a new page puts a rung on the ladder automatically
 * instead of leaving the screen a level behind the rules.
 *
 * A thousand rungs sounds like a lot to hold; it is a thousand small objects
 * built once at import, which is less than this app spends on its guitar
 * catalogue. The alternative — deriving each rung on demand — buys nothing back
 * and costs every caller a different shape.
 */
export const LEVEL_MILESTONES: LevelMilestone[] = buildLadder();

/** The rung at exactly `lvl`, if there is one. */
export const getLevelMilestone = (lvl: number): LevelMilestone | undefined =>
  LEVEL_MILESTONES.find((milestone) => milestone.lvl === lvl);

/** The next rung above `lvl`, or null once the ladder is behind the account. */
export const getNextMilestone = (lvl: number): LevelMilestone | null =>
  LEVEL_MILESTONES.find((milestone) => milestone.lvl > lvl) ?? null;

/**
 * Rungs reached since the ladder started watching, whose payout has not been
 * collected.
 *
 * Reached, not passed: a level that pays nothing never appears here, and a
 * level claimed long ago never comes back.
 *
 * `baseline` is where the account's history ends — the rung it already stood on
 * when the ladder first saw it, from `RewardLedger.levelBaseline`. Everything at
 * or below it was climbed before the rewards existed and is never paid out; the
 * ladder pays forwards only, so a player who arrives at level 30 is owed level
 * 31 and nothing behind it. Callers with no baseline recorded yet pass the
 * account's current level, which owes exactly nothing.
 */
export const getClaimableLevels = (
  lvl: number,
  claimed: readonly string[],
  baseline: number,
): LevelMilestone[] =>
  LEVEL_MILESTONES.filter(
    (milestone) =>
      milestone.payout !== null &&
      milestone.lvl <= lvl &&
      milestone.lvl > baseline &&
      !claimed.includes(levelRewardId(milestone.lvl)),
  );
