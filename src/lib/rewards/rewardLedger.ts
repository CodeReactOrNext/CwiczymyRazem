import type { AchievementList } from "feature/achievements/types";

/**
 * Everything the account has been paid and has left to spend, stored at
 * `rewards` on the user document.
 *
 * Deliberately a top-level field rather than a corner of `statistics` or of
 * `arsenal`: both of those are client-writable under `firestore.rules`, and a
 * ledger a client can write is a ledger that can pay itself. This one is on the
 * blocked list, so only the Admin SDK — the routes under `/api/rewards` and
 * `/api/arsenal/open-case` — can move it.
 *
 * One ledger for every source of rewards, not one per source: the free cases
 * are a single wallet whatever earned them, and splitting the wallet would mean
 * the case shop having to ask two places how much a player is holding.
 */
export interface RewardLedger {
  /** Badges already collected. A badge pays once, ever. */
  claimedAchievements: AchievementList[];
  /** Boxes of a scale tree already collected, by reward id. Same rule. */
  claimedScales: string[];
  /** Mastery journey modules already collected, by reward id. Same rule. */
  claimedJourneys: string[];
  /** Curated AI-coach roadmaps already collected, by reward id. Same rule. */
  claimedRoadmaps: string[];
  /** Unspent free cases. One opens any case on the shelf without paying Fame. */
  caseTokens: number;
}

export const EMPTY_REWARD_LEDGER: RewardLedger = {
  claimedAchievements: [],
  claimedScales: [],
  claimedJourneys: [],
  claimedRoadmaps: [],
  caseTokens: 0,
};

const readIds = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((id): id is string => typeof id === "string")
    : [];

/**
 * The ledger as stored, normalised.
 *
 * Absent on every account that predates the rewards, and partly absent on one
 * that has spent a token but never claimed anything, so every field is read
 * defensively rather than assumed.
 */
export const readRewardLedger = (
  data: Record<string, unknown> | undefined,
): RewardLedger => {
  const stored = (data?.rewards ?? {}) as Partial<RewardLedger>;
  const tokens = Number(stored.caseTokens);

  return {
    claimedAchievements: readIds(
      stored.claimedAchievements,
    ) as AchievementList[],
    claimedScales: readIds(stored.claimedScales),
    claimedJourneys: readIds(stored.claimedJourneys),
    claimedRoadmaps: readIds(stored.claimedRoadmaps),
    caseTokens: Number.isFinite(tokens) && tokens > 0 ? Math.floor(tokens) : 0,
  };
};
