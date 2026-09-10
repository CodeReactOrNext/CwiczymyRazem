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

const buildLadder = (): LevelMilestone[] => {
  const levels = new Set<number>([
    ...Object.keys(LEVEL_PAYOUTS).map(Number),
    ...Object.values(RARITY_UNLOCK_LVL),
    ...FEATURE_UNLOCK_LIST.map((feature) => feature.requiredLvl),
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
      payout: LEVEL_PAYOUTS[lvl] ?? null,
    }));
};

/**
 * The whole ladder, ascending.
 *
 * Built once from the three sources rather than typed out, so adding a rarity
 * threshold or gating a new page puts a rung on the ladder automatically
 * instead of leaving the screen a level behind the rules.
 */
export const LEVEL_MILESTONES: LevelMilestone[] = buildLadder();

/** The rung at exactly `lvl`, if there is one. */
export const getLevelMilestone = (lvl: number): LevelMilestone | undefined =>
  LEVEL_MILESTONES.find((milestone) => milestone.lvl === lvl);

/** The next rung above `lvl`, or null once the ladder is behind the account. */
export const getNextMilestone = (lvl: number): LevelMilestone | null =>
  LEVEL_MILESTONES.find((milestone) => milestone.lvl > lvl) ?? null;

/**
 * Rungs already reached whose payout has not been collected.
 *
 * Reached, not passed: a level that pays nothing never appears here, and a
 * level claimed long ago never comes back. The account keeps every rung it
 * climbed past while the feature did not exist yet, which is the point — the
 * ladder ships owing people their back pay.
 */
export const getClaimableLevels = (
  lvl: number,
  claimed: readonly string[],
): LevelMilestone[] =>
  LEVEL_MILESTONES.filter(
    (milestone) =>
      milestone.payout !== null &&
      milestone.lvl <= lvl &&
      !claimed.includes(levelRewardId(milestone.lvl)),
  );
