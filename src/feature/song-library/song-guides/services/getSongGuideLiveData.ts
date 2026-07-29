import { getTierFromDifficulty } from "feature/songs/utils/difficulty.utils";
import { firestore } from "utils/firebase/api/firebase.config";

import type { CrossGuideDifficultyMap, GuideLiveData } from "../types";

const emptyLiveData: GuideLiveData = { song: null };

interface RawSongDoc {
  title?: string;
  artist?: string;
  avgDifficulty?: number;
  tier?: string;
  popularity?: number;
  coverUrl?: string;
  difficulties?: unknown[];
}

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
    const songSnap = await firestore.collection("songs").doc(songId).get();

    if (!songSnap.exists) return emptyLiveData;

    const data = (songSnap.data() ?? {}) as RawSongDoc;
    const avgDifficulty =
      typeof data.avgDifficulty === "number" ? data.avgDifficulty : 0;

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
    };
  } catch {
    return emptyLiveData;
  }
}

/**
 * Fetches live avgDifficulty/tier for songs that other guides link to via
 * `learningPath.easier/harder[].guideSlug`. Without this, a cross-linked
 * mini-card would show a hand-written `difficulty` guess that can silently
 * disagree with the real tier the linked song's own page displays once
 * community ratings come in — see the master-of-puppets 8.6-vs-7.2 case.
 * Fails soft per-song: a missing/unreadable doc just falls out of the map so
 * the caller's editorial fallback takes over for that entry.
 */
export async function getCrossGuideDifficulties(
  entries: { guideSlug: string; songId: string | null }[]
): Promise<CrossGuideDifficultyMap> {
  const result: CrossGuideDifficultyMap = {};

  const validEntries = entries.filter(
    (entry): entry is { guideSlug: string; songId: string } =>
      Boolean(entry.songId)
  );

  await Promise.all(
    validEntries.map(async ({ guideSlug, songId }) => {
      try {
        const snap = await firestore.collection("songs").doc(songId).get();
        if (!snap.exists) return;

        const data = (snap.data() ?? {}) as RawSongDoc;
        const avgDifficulty =
          typeof data.avgDifficulty === "number" ? data.avgDifficulty : 0;
        if (avgDifficulty <= 0) return;

        result[guideSlug] = {
          avgDifficulty,
          tier:
            typeof data.tier === "string" && data.tier !== "?"
              ? data.tier
              : getTierFromDifficulty(avgDifficulty),
        };
      } catch {
        // Fall through — caller falls back to the editorial estimate.
      }
    })
  );

  return result;
}

/**
 * Fetches cover art for a batch of songIds, keyed by songId. Used by the
 * song-library index page to show real album art on the "Deep-dive song
 * guides" cards without pulling the full live-data payload for each one.
 * Fails soft per-song, same as the functions above.
 */
export async function getGuideCoverUrls(
  songIds: (string | null)[]
): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};

  const uniqueIds = [...new Set(songIds.filter((id): id is string => Boolean(id)))];

  await Promise.all(
    uniqueIds.map(async (songId) => {
      try {
        const snap = await firestore.collection("songs").doc(songId).get();
        if (!snap.exists) return;

        const data = (snap.data() ?? {}) as RawSongDoc;
        result[songId] =
          typeof data.coverUrl === "string" ? data.coverUrl : null;
      } catch {
        // Fall through — caller falls back to no cover for this song.
      }
    })
  );

  return result;
}
