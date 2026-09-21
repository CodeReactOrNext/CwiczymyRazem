import type { AchievementList } from "feature/achievements/types";

/**
 * The payload that bumps `config/achievementStats` after a report.
 *
 * Split out of the route so the *shape* can be asserted without Firestore,
 * because the shape is the whole bug this exists to prevent. The first version
 * wrote `{ "counts.rig_50": increment(1) }` and passed it to `set(…, { merge:
 * true })`. Only `update()` reads a dotted string as a path into a map; `set()`
 * takes the key literally, so every report created a top-level field *named*
 * `counts.rig_50` beside the `counts` map instead of touching it. The panel
 * reads `stats.counts[id]`, saw nothing there, and drew a column of `0.0%`
 * while 577 increments piled up in 57 fields nothing reads.
 *
 * A nested object has no such ambiguity: under `merge: true` Firestore merges
 * maps key by key, so this touches one counter and leaves its siblings, the
 * denominator and `updatedAt` alone — and still creates the document on the
 * first report after a fresh deployment.
 *
 * `increment` is passed in rather than imported so this file never pulls
 * `firebase-admin` into anything that imports it.
 */
export const buildAchievementStatsUpdate = <T>(
  newAchievements: AchievementList[],
  becameAPlayer: boolean,
  increment: (by: number) => T
): { counts?: Record<string, T>; totalPlayers?: T } | null => {
  // A badge is a set, but the stored array is just an array — the same
  // deduplication `tallyAchievementStats` does, so a double-granted id cannot
  // put the live counter above what a recount would produce.
  const ids = [...new Set(newAchievements)];

  if (ids.length === 0 && !becameAPlayer) return null;

  const update: { counts?: Record<string, T>; totalPlayers?: T } = {};

  if (ids.length > 0) {
    update.counts = Object.fromEntries(ids.map((id) => [id, increment(1)]));
  }
  if (becameAPlayer) {
    update.totalPlayers = increment(1);
  }

  return update;
};
