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
  /**
   * Level milestones already collected, by reward id. Same rule.
   *
   * Only ever rungs climbed since `levelBaseline` — the list is what has been
   * paid, never what was reached.
   */
  claimedLevels: string[];
  /**
   * The rung the account already stood on when the ladder first saw it.
   *
   * Nothing at or below it is ever owed. An account sitting at level 30 when
   * the ladder shipped climbed those thirty levels while the rewards did not
   * exist, and back-paying them would drop a season's worth of cases, parts and
   * mods into one stash for practice that was already done and already paid for
   * in points. The ladder pays forwards: from here on, reaching a level is what
   * earns the rung.
   *
   * Null until a reward route first sees the account, at which point it is
   * sealed — at the level the player stood on before the session being filed
   * (`api/user/report`), or at the current level if a claim gets there first.
   * Written once and never moved again; a baseline that drifted upwards would
   * quietly swallow rungs that were genuinely earned.
   */
  levelBaseline: number | null;
  /** Unspent free cases. One opens any case on the shelf without paying Fame. */
  caseTokens: number;
}

export const EMPTY_REWARD_LEDGER: RewardLedger = {
  claimedAchievements: [],
  claimedScales: [],
  claimedJourneys: [],
  claimedRoadmaps: [],
  claimedLevels: [],
  levelBaseline: null,
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
  const baseline = stored.levelBaseline;

  return {
    claimedAchievements: readIds(
      stored.claimedAchievements,
    ) as AchievementList[],
    claimedScales: readIds(stored.claimedScales),
    claimedJourneys: readIds(stored.claimedJourneys),
    claimedRoadmaps: readIds(stored.claimedRoadmaps),
    claimedLevels: readIds(stored.claimedLevels),
    // Read as "unset" rather than coerced, because the two are not the same
    // thing here: a missing baseline means the ladder has not seen this account
    // yet, while a zero would mean it is owed the whole climb.
    levelBaseline:
      typeof baseline === "number" && Number.isFinite(baseline) && baseline >= 1
        ? Math.floor(baseline)
        : null,
    caseTokens: Number.isFinite(tokens) && tokens > 0 ? Math.floor(tokens) : 0,
  };
};
