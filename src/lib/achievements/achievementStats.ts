import type { AchievementList } from "feature/achievements/types";

/**
 * How many accounts hold each badge, and how many accounts the share is out of.
 *
 * Kept in one document rather than a document per badge, because the panel wants
 * all of it at once: one read against 77. The trade is that every increment lands
 * on the same document, and Firestore sustains roughly one write per second per
 * document — a long way above a few badges per finished practice session at this
 * size. If that ever became the ceiling, the fix is sharding the counters across
 * N documents and summing on read, not a document per badge.
 *
 * Only the Admin SDK ever writes it: `/config` has no rule in `firestore.rules`,
 * so a client can neither forge a count nor read the document directly — the
 * panel goes through `/api/achievements/stats` instead. That is also why adding
 * this needed no security-rule change.
 */
export const ACHIEVEMENT_STATS_PATH = "config/achievementStats";

export interface AchievementStatsDoc {
  /** Badge id to the number of accounts holding it. Absent means nobody yet. */
  counts: Partial<Record<AchievementList, number>>;
  /**
   * Accounts the percentages are out of.
   *
   * Everyone who has finished at least one session, rather than every user
   * document: an account that signed up and never played would drag every share
   * down while telling you nothing about how hard a badge is.
   */
  totalPlayers: number;
  /** Epoch ms of the last full recount. */
  updatedAt: number;
}

/** Whether an account counts toward the denominator. See `totalPlayers`. */
export const countsAsPlayer = (statistics: { sessionCount?: number } | undefined): boolean =>
  (statistics?.sessionCount ?? 0) > 0;

/**
 * Share of players holding a badge, to one decimal.
 *
 * `null` when there is nothing to divide by — no stats document yet, or a
 * recount that has not run. Callers fall back rather than rendering `0.0%`,
 * which would read as "nobody has this" instead of "not counted yet".
 */
export const rateFromStats = (
  id: AchievementList,
  stats: AchievementStatsDoc | null | undefined
): number | null => {
  if (!stats || stats.totalPlayers <= 0) return null;

  const held = stats.counts?.[id] ?? 0;
  // Clamped because the live counter can outrun a stale denominator: a badge
  // earned between two recounts bumps `counts` but not `totalPlayers`.
  const share = Math.min(held / stats.totalPlayers, 1);

  return Math.round(share * 1000) / 10;
};

/**
 * Tallies one pass over the accounts into the document shape above.
 *
 * Pure, so the backfill script can be read and tested without Firestore: it
 * feeds in what it paged through, and this decides what the numbers are.
 */
export const tallyAchievementStats = (
  accounts: { achievements?: AchievementList[]; sessionCount?: number }[],
  now: number = Date.now()
): AchievementStatsDoc => {
  const counts: Partial<Record<AchievementList, number>> = {};
  let totalPlayers = 0;

  for (const account of accounts) {
    if (!countsAsPlayer(account)) continue;
    totalPlayers += 1;

    // A badge is a set, but the stored array is just an array — a duplicate id
    // from an old double-write would otherwise count the account twice.
    for (const id of new Set(account.achievements ?? [])) {
      counts[id] = (counts[id] ?? 0) + 1;
    }
  }

  return { counts, totalPlayers, updatedAt: now };
};
