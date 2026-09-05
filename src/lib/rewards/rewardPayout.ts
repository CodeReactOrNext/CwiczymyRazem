import {
  PART_DEFINITIONS,
  PART_TIERS,
} from "feature/arsenal/data/partDefinitions";
import type {
  PartId,
  PartTier,
  ScrapPart,
} from "feature/arsenal/types/arsenal.types";
import { mulberry32 } from "feature/arsenal/utils/seededRandom";

/**
 * One payout, whatever earned it.
 *
 * The same three currencies back every reward in the game — the badge wall, the
 * scale trees, and whatever comes next — so they share a shape and a summary
 * component rather than each inventing their own. Points are deliberately not
 * among them: points are the leaderboard's ranking currency, and a reward that
 * paid them would let a player climb the board by collecting rather than by
 * practising.
 */
export interface RewardPayout {
  fame: number;
  /** Free cases. One opens any case on the shelf without spending Fame. */
  caseTokens: number;
  /** Salvage parts, stacked by (partId, tier). */
  parts: ScrapPart[];
}

export const EMPTY_PAYOUT: RewardPayout = { fame: 0, caseTokens: 0, parts: [] };

/** A reward slot before its part has been drawn. */
export interface PartSlot {
  tier: Exclude<PartTier, "Unique">;
  qty: number;
}

const tierRank = (tier: PartTier): number => PART_TIERS.indexOf(tier);

/**
 * Which parts can be handed out at `tier` — a screw has no Epic grade, so a
 * slot asking for one has to draw from the parts that reach that far.
 */
const partsAtTier = (tier: PartTier): PartId[] =>
  PART_DEFINITIONS.filter(
    (part) => tierRank(part.maxTier) >= tierRank(tier),
  ).map((part) => part.id);

/**
 * Seeds a draw from a string.
 *
 * The part a reward pays has to be the same everywhere: the panel prints it
 * before the player claims, and the claim route re-derives it rather than
 * trusting what the panel said. Rolling it live would have meant the two
 * disagreeing, so the id is the seed and the draw is a pure function of it.
 */
const seedFromKey = (key: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

/**
 * A seeded generator for one reward.
 *
 * Exported so a reward can draw more than its parts from the same rule — the
 * journey trophy picks its guitar this way — and every draw a key makes stays
 * identical on the client that prints it and the server that grants it.
 */
export const rewardRandom = (seedKey: string): (() => number) =>
  mulberry32(seedFromKey(seedKey));

/** The parts `slots` are worth, drawn deterministically from `seedKey`. */
export const rollRewardParts = (
  seedKey: string,
  slots: readonly PartSlot[],
): ScrapPart[] => {
  const random = rewardRandom(seedKey);

  return slots.map((slot) => {
    const pool = partsAtTier(slot.tier);
    return {
      partId: pool[Math.floor(random() * pool.length)],
      tier: slot.tier,
      qty: slot.qty,
    };
  });
};

/** Merges part stacks so a batch pays one row per (partId, tier). */
export const mergeRewardParts = (parts: ScrapPart[]): ScrapPart[] => {
  const stacks = new Map<string, ScrapPart>();
  for (const part of parts) {
    const key = `${part.partId}:${part.tier}`;
    const existing = stacks.get(key);
    if (existing) existing.qty += part.qty;
    else stacks.set(key, { ...part });
  }
  return [...stacks.values()];
};

/** One receipt for a whole batch of payouts. */
export const sumRewardPayouts = (payouts: RewardPayout[]): RewardPayout => ({
  fame: payouts.reduce((sum, payout) => sum + payout.fame, 0),
  caseTokens: payouts.reduce((sum, payout) => sum + payout.caseTokens, 0),
  parts: mergeRewardParts(payouts.flatMap((payout) => payout.parts)),
});
