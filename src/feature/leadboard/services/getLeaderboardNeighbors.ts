import type { LeaderboardViewType } from "feature/leadboard/hooks/useLeaderboard";
import type { DocumentData } from "firebase/firestore";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { memoryCache } from "utils/cache/memoryCache";
import type { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";
import { db } from "utils/firebase/client/firebase.utils";

export interface LeaderboardNeighborRow {
  user: FirebaseUserDataInterface;
  place: number;
  score: number;
}

export interface LeaderboardNeighbors {
  /** Players above, the player, players below — in display order. */
  rows: LeaderboardNeighborRow[];
  /** The closest player above and how much it takes to pass them. */
  nextRival: { displayName: string; place: number; gap: number } | null;
}

/** How many players to show on each side of the player. */
const NEIGHBORS_PER_SIDE = 2;

/**
 * A season document keeps the stats flat; the rows expect the shape of a
 * user document, so the season's fields are folded into `statistics`.
 */
export const mapSeasonalUser = (
  id: string,
  data: DocumentData,
): FirebaseUserDataInterface =>
  ({
    profileId: id,
    displayName: data.displayName || "",
    avatar: data.avatar || "",
    selectedGuitar: data.selectedGuitar || "",
    selectedGuitarYear: data.selectedGuitarYear || 0,
    selectedGuitarCountry: data.selectedGuitarCountry || "",
    createdAt: new Date(),
    songLists: [],
    statistics: {
      points: data.points || 0,
      sessionCount: data.sessionCount || 0,
      time: {
        creativity: data.time?.creativity || 0,
        hearing: data.time?.hearing || 0,
        technique: data.time?.technique || 0,
        theory: data.time?.theory || 0,
        longestSession: data.time?.longestSession || 0,
      },
      achievements: data.achievements || [],
      lvl: data.lvl || 1,
      lastReportDate: data.lastReportDate || "",
    },
  }) as unknown as FirebaseUserDataInterface;

const getSource = (view: LeaderboardViewType, seasonId?: string) => {
  if (view === "seasonal" && seasonId) {
    return {
      col: collection(db, "seasons", seasonId, "users"),
      field: "points",
      toUser: mapSeasonalUser,
    };
  }
  return {
    col: collection(db, "users"),
    field: view === "gear" ? "rigLevel" : "statistics.points",
    toUser: (id: string, data: DocumentData) =>
      ({ profileId: id, ...data }) as FirebaseUserDataInterface,
  };
};

const readScore = (data: DocumentData, field: string): number =>
  (field.split(".").reduce<unknown>(
    (value, key) => (value as Record<string, unknown> | undefined)?.[key],
    data,
  ) as number | undefined) ?? 0;

/**
 * The slice of a ranking around the player: who stands just above, the
 * player's own row, and who stands just below — so the page can answer "where
 * am I and who is next" without paging down to the player's place.
 *
 * `rank` comes from the same count the hero shows, so both agree. Players tied
 * with the player share their place.
 */
export const getLeaderboardNeighbors = async ({
  view,
  userId,
  score,
  rank,
  seasonId,
}: {
  view: LeaderboardViewType;
  userId: string;
  score: number;
  rank: number;
  seasonId?: string;
}): Promise<LeaderboardNeighbors | null> => {
  const cacheKey = `leaderboardNeighbors:${view}:${seasonId ?? ""}:${userId}:${score}:${rank}`;
  const cached = memoryCache.get(cacheKey) as LeaderboardNeighbors | null;
  if (cached) return cached;

  const { col, field, toUser } = getSource(view, seasonId);

  const [aboveDocs, belowDocs, ownDoc] = await Promise.all([
    getDocs(
      query(col, where(field, ">", score), orderBy(field, "asc"), limit(NEIGHBORS_PER_SIDE)),
    ),
    // One extra leaves room to drop the player's own document.
    getDocs(
      query(col, where(field, "<=", score), orderBy(field, "desc"), limit(NEIGHBORS_PER_SIDE + 1)),
    ),
    getDoc(doc(col, userId)),
  ]);

  if (!ownDoc.exists()) return null;

  // Closest rival first, so the places count away from the player.
  const above = aboveDocs.docs.map((entry, index) => ({
    user: toUser(entry.id, entry.data()),
    place: rank - 1 - index,
    score: readScore(entry.data(), field),
  }));

  const below = belowDocs.docs
    .filter((entry) => entry.id !== userId)
    .slice(0, NEIGHBORS_PER_SIDE)
    .map((entry, index) => {
      const entryScore = readScore(entry.data(), field);
      return {
        user: toUser(entry.id, entry.data()),
        place: entryScore === score ? rank : rank + 1 + index,
        score: entryScore,
      };
    });

  const closest = above[0];
  const neighbors: LeaderboardNeighbors = {
    rows: [
      ...[...above].reverse(),
      { user: toUser(ownDoc.id, ownDoc.data()), place: rank, score },
      ...below,
    ],
    nextRival: closest
      ? {
          displayName: closest.user.displayName || "the next player",
          place: closest.place,
          // Passing takes strictly more than they have.
          gap: closest.score - score + 1,
        }
      : null,
  };

  memoryCache.set(cacheKey, neighbors, 5 * 60 * 1000); // 5 minutes cache
  return neighbors;
};
