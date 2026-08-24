import { collection, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { memoryCache } from "utils/cache/memoryCache";
import { db } from "utils/firebase/client/firebase.utils";

export interface RankNeighbor {
  userId: string;
  displayName: string;
  avatar: string;
  score: number;
  rank: number;
}

export interface ExerciseRankNeighbors {
  /** 1-based place the score holds on the exercise leaderboard. */
  rank: number;
  /** Players standing above, in display order — the closest rival comes last. */
  above: RankNeighbor[];
  /** Players standing below, closest first. */
  below: RankNeighbor[];
}

/** How many players to show on each side of the player. */
const NEIGHBORS_PER_SIDE = 2;

const toNeighbor = (
  entry: { id: string; data: () => Record<string, unknown> },
  rank: number
): RankNeighbor => ({
  userId: entry.id,
  displayName: (entry.data().displayName as string) || "Anonymous",
  avatar: (entry.data().avatar as string) || "",
  score: entry.data().score as number,
  rank,
});

/**
 * The slice of an exercise leaderboard around a given score: who stands above
 * and who stands below.
 *
 * The player's own entry is filtered out of both sides — a record of theirs that
 * sits above the score being placed is not a rival to chase.
 */
export const getExerciseRankNeighbors = async (
  exerciseId: string,
  score: number,
  userId?: string
): Promise<ExerciseRankNeighbors | null> => {
  if (score <= 0) return null;

  const cacheKey = `exerciseRankNeighbors:${exerciseId}:${score}:${userId ?? "anon"}`;
  const cached = memoryCache.get(cacheKey) as ExerciseRankNeighbors | null;
  if (cached) return cached;

  try {
    const col = collection(db, "exerciseLeaderboards", exerciseId, "entries");
    // One extra on each side leaves room to drop the player's own entry.
    const fetchCount = NEIGHBORS_PER_SIDE + 1;

    const [aboveCount, aboveDocs, belowDocs, ownEntry] = await Promise.all([
      getCountFromServer(query(col, where("score", ">", score))),
      getDocs(query(col, where("score", ">", score), orderBy("score", "asc"), limit(fetchCount))),
      getDocs(query(col, where("score", "<", score), orderBy("score", "desc"), limit(fetchCount))),
      userId ? getDoc(doc(col, userId)) : Promise.resolve(null),
    ]);

    const ownScore = ownEntry?.exists() ? (ownEntry.data().score as number) : 0;
    const rank = aboveCount.data().count + 1 - (ownScore > score ? 1 : 0);

    const notThePlayer = (entry: { id: string }) => entry.id !== userId;
    // Closest rival first, so the rank offsets below count away from the player.
    const above = aboveDocs.docs.filter(notThePlayer).slice(0, NEIGHBORS_PER_SIDE)
      .map((entry, index) => toNeighbor(entry, rank - 1 - index));
    const below = belowDocs.docs.filter(notThePlayer).slice(0, NEIGHBORS_PER_SIDE)
      .map((entry, index) => toNeighbor(entry, rank + 1 + index));

    const neighbors: ExerciseRankNeighbors = { rank, above: [...above].reverse(), below };

    memoryCache.set(cacheKey, neighbors, 5 * 60 * 1000); // 5 minutes cache
    return neighbors;
  } catch (error) {
    console.error(`Error getting rank neighbors for exercise ${exerciseId}:`, error);
    return null;
  }
};
