import { getTierFromDifficulty } from "feature/songs/utils/difficulty.utils";
import { firestore } from "utils/firebase/api/firebase.config";

import type { GuideLiveData, GuideLiveSong } from "../types";

const SIMILAR_POOL_SIZE = 100;
const SIMILAR_LIMIT = 3;
const SIMILAR_WINDOW = 2.5;
const SIMILAR_GAP = 0.4;

const emptyLiveData: GuideLiveData = {
  song: null,
  easierSongs: [],
  harderSongs: [],
};

interface RawSongDoc {
  title?: string;
  artist?: string;
  avgDifficulty?: number;
  tier?: string;
  popularity?: number;
  coverUrl?: string;
  difficulties?: unknown[];
}

const toLiveSong = (id: string, data: RawSongDoc): GuideLiveSong => ({
  id,
  title: typeof data.title === "string" ? data.title : "",
  artist: typeof data.artist === "string" ? data.artist : "",
  avgDifficulty:
    typeof data.avgDifficulty === "number" ? data.avgDifficulty : 0,
  tier:
    typeof data.tier === "string"
      ? data.tier
      : getTierFromDifficulty(data.avgDifficulty ?? 0),
  popularity: typeof data.popularity === "number" ? data.popularity : 0,
  coverUrl: typeof data.coverUrl === "string" ? data.coverUrl : null,
});

/**
 * Build-time / ISR fetch of community data for a song guide. Fails soft:
 * without credentials or when the song doc is missing it returns empty data
 * and the page falls back to editorial estimates.
 */
export async function getSongGuideLiveData(
  songId: string | null
): Promise<GuideLiveData> {
  if (!songId) return emptyLiveData;

  try {
    const [songSnap, poolSnap] = await Promise.all([
      firestore.collection("songs").doc(songId).get(),
      firestore
        .collection("songs")
        .orderBy("popularity", "desc")
        .limit(SIMILAR_POOL_SIZE)
        .get(),
    ]);

    if (!songSnap.exists) return emptyLiveData;

    const data = (songSnap.data() ?? {}) as RawSongDoc;
    const avgDifficulty =
      typeof data.avgDifficulty === "number" ? data.avgDifficulty : 0;

    const pool: GuideLiveSong[] = poolSnap.docs
      .filter((doc: { id: string }) => doc.id !== songId)
      .map((doc: { id: string; data: () => RawSongDoc }) =>
        toLiveSong(doc.id, doc.data())
      )
      .filter((song: GuideLiveSong) => song.avgDifficulty > 0 && song.title);

    const easierSongs =
      avgDifficulty > 0
        ? pool
            .filter(
              (song) =>
                song.avgDifficulty <= avgDifficulty - SIMILAR_GAP &&
                song.avgDifficulty >= avgDifficulty - SIMILAR_WINDOW
            )
            .slice(0, SIMILAR_LIMIT)
        : [];

    const harderSongs =
      avgDifficulty > 0
        ? pool
            .filter(
              (song) =>
                song.avgDifficulty >= avgDifficulty + SIMILAR_GAP &&
                song.avgDifficulty <= avgDifficulty + SIMILAR_WINDOW
            )
            .slice(0, SIMILAR_LIMIT)
        : [];

    return {
      song: {
        avgDifficulty,
        ratingsCount: Array.isArray(data.difficulties)
          ? data.difficulties.length
          : 0,
        tier:
          typeof data.tier === "string" && data.tier !== "?"
            ? data.tier
            : getTierFromDifficulty(avgDifficulty),
        popularity: typeof data.popularity === "number" ? data.popularity : 0,
        coverUrl: typeof data.coverUrl === "string" ? data.coverUrl : null,
      },
      easierSongs,
      harderSongs,
    };
  } catch {
    return emptyLiveData;
  }
}
