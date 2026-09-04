import type { PartSlot, RewardPayout } from "lib/rewards/rewardPayout";
import { rollRewardParts, sumRewardPayouts } from "lib/rewards/rewardPayout";

import type { AchievementList, AchievementsDataInterface } from "../types";
import { achievementsMap } from "./achievementsData";
import type { AchievementsRarityType } from "./achievementsRarity";

export type AchievementRarity = AchievementsRarityType["rarity"];

/** What one badge pays out when its reward is collected. */
export type AchievementReward = RewardPayout;

interface RewardSpec {
  fame: number;
  caseTokens: number;
  parts: PartSlot[];
}

/**
 * What each rarity is worth.
 *
 * Sized against the Fame curve rather than against the badges: a committed
 * player earns roughly 40-80 Fame a day, and a case costs 120-350. Clearing the
 * whole board — 77 badges accumulated over months — pays about 7,500 Fame, so a
 * long-standing account collecting its whole backlog at once gets a few weeks of
 * shopping, not a finished collection.
 *
 * Only `epic` pays a free case. Twelve badges carry that rarity, so the token
 * stays a rare thing to hold; handing one out at `veryRare` too would have put
 * 34 free cases in the game and made the shelf's price ladder decorative.
 */
export const ACHIEVEMENT_REWARDS: Record<AchievementRarity, RewardSpec> = {
  common: { fame: 25, caseTokens: 0, parts: [{ tier: "Standard", qty: 2 }] },
  rare: { fame: 60, caseTokens: 0, parts: [{ tier: "Standard", qty: 3 }] },
  veryRare: { fame: 120, caseTokens: 0, parts: [{ tier: "Epic", qty: 2 }] },
  epic: {
    fame: 250,
    caseTokens: 1,
    parts: [
      { tier: "Epic", qty: 2 },
      { tier: "Legendary", qty: 1 },
    ],
  },
};

/** The badge's payout. Deterministic: same id, same parts, on every client and on the server. */
export const getAchievementReward = (
  id: AchievementList,
  rarity: AchievementRarity,
): AchievementReward => {
  const spec = ACHIEVEMENT_REWARDS[rarity];
  return {
    fame: spec.fame,
    caseTokens: spec.caseTokens,
    parts: rollRewardParts(id, spec.parts),
  };
};

/**
 * Every badge's payout, resolved once.
 *
 * Identity matters as much as the value here: the panel hands one of these to
 * each of 77 rows on every render, and a freshly built object would defeat the
 * row's `memo` and re-render the whole list — badge art, motion and all — every
 * time anything above it changed.
 */
const REWARD_CACHE = new Map<AchievementList, AchievementReward>();

/**
 * The payout for a badge looked up by id alone.
 *
 * Returns null for an id that is not in the registry — an account can carry a
 * badge from a definition that has since been retired, and that must not be
 * claimable for a reward nothing prices.
 */
export const resolveAchievementReward = (
  id: AchievementList,
  registry: Map<AchievementList, AchievementsDataInterface> = achievementsMap,
): AchievementReward | null => {
  const data = registry.get(id);
  if (!data) return null;

  // Only the default registry is cached; a caller passing its own table is a
  // test, and must not be served another table's answer.
  if (registry !== achievementsMap) return getAchievementReward(id, data.rarity);

  const cached = REWARD_CACHE.get(id);
  if (cached) return cached;

  const reward = getAchievementReward(id, data.rarity);
  REWARD_CACHE.set(id, reward);
  return reward;
};

/** One receipt for a whole batch of badges. */
export const sumAchievementRewards = sumRewardPayouts;

/**
 * The badges that have been earned but not yet collected, in registry order.
 *
 * Both the panel and the claim route run this — the route over the stored
 * document, so a client asking for a badge it has not earned, or for one it has
 * already been paid for, simply falls out of the list rather than erroring.
 */
export const getClaimableAchievements = (
  earned: readonly AchievementList[],
  claimed: readonly AchievementList[],
  registry: Map<AchievementList, AchievementsDataInterface> = achievementsMap,
): AchievementList[] => {
  const alreadyClaimed = new Set(claimed);
  const seen = new Set<AchievementList>();

  return earned.filter((id) => {
    if (alreadyClaimed.has(id) || seen.has(id) || !registry.has(id)) return false;
    seen.add(id);
    return true;
  });
};

/** Everything a batch of badges is worth, without granting anything. */
export const previewClaim = (ids: readonly AchievementList[]): AchievementReward =>
  sumRewardPayouts(
    ids
      .map((id) => resolveAchievementReward(id))
      .filter((reward): reward is AchievementReward => reward !== null),
  );
