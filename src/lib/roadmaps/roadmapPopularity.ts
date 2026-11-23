import type { Firestore } from "firebase-admin/firestore";

/** One document per roadmap: `{ roadmapId, players, countedAt }`. Admin SDK only. */
export const ROADMAP_STATS_COLLECTION = "roadmapStats";
const PROGRESS_COLLECTION = "userRoadmapProgress";

/**
 * How long a stored count is trusted. A roadmap's popularity moves by a few
 * players a day, so a day-old number is as good as a live one.
 */
export const POPULARITY_TTL_MS = 24 * 60 * 60 * 1000;

/** roadmapId → players who have progress saved on it. */
export type RoadmapPopularity = Record<string, number>;

interface StoredStat {
  roadmapId?: string;
  players?: number;
  countedAt?: string;
}

/**
 * Players on each roadmap, counted from the progress documents: one document
 * is one player who has done something on that roadmap. An aggregation query
 * per roadmap, so the cost does not grow with the number of players.
 */
export async function countRoadmapPlayers(
  db: Firestore,
  roadmapIds: string[],
): Promise<RoadmapPopularity> {
  const counts = await Promise.all(
    roadmapIds.map(async (roadmapId) => {
      const snapshot = await db
        .collection(PROGRESS_COLLECTION)
        .where("roadmapId", "==", roadmapId)
        .count()
        .get();
      return [roadmapId, snapshot.data().count] as const;
    }),
  );
  return Object.fromEntries(counts);
}

/** Stores the counts, stamped with when they were taken. */
export async function writeRoadmapPopularity(
  db: Firestore,
  counts: RoadmapPopularity,
  now: number = Date.now(),
): Promise<void> {
  const entries = Object.entries(counts);
  if (!entries.length) return;
  const batch = db.batch();
  const countedAt = new Date(now).toISOString();
  entries.forEach(([roadmapId, players]) => {
    batch.set(db.collection(ROADMAP_STATS_COLLECTION).doc(roadmapId), {
      roadmapId,
      players,
      countedAt,
    });
  });
  await batch.commit();
}

/**
 * The stored counts for these roadmaps. One that was never counted, or was
 * counted more than a day ago, is counted again and stored on the way — so
 * the numbers keep themselves fresh without a cron, and a new curated
 * roadmap gets its count the first time anybody asks.
 */
export async function readRoadmapPopularity(
  db: Firestore,
  roadmapIds: string[],
  now: number = Date.now(),
): Promise<RoadmapPopularity> {
  if (!roadmapIds.length) return {};
  const snapshots = await db.getAll(
    ...roadmapIds.map((id) => db.collection(ROADMAP_STATS_COLLECTION).doc(id)),
  );

  const result: RoadmapPopularity = {};
  const stale: string[] = [];
  snapshots.forEach((snapshot, index) => {
    const roadmapId = roadmapIds[index];
    const stat = snapshot.data() as StoredStat | undefined;
    const countedAt = stat?.countedAt ? Date.parse(stat.countedAt) : NaN;
    if (
      typeof stat?.players === "number" &&
      Number.isFinite(countedAt) &&
      now - countedAt <= POPULARITY_TTL_MS
    ) {
      result[roadmapId] = stat.players;
      return;
    }
    // A stale number is still better than none if the recount fails.
    if (typeof stat?.players === "number") result[roadmapId] = stat.players;
    stale.push(roadmapId);
  });

  if (stale.length) {
    const fresh = await countRoadmapPlayers(db, stale);
    await writeRoadmapPopularity(db, fresh, now);
    Object.assign(result, fresh);
  }
  return result;
}
