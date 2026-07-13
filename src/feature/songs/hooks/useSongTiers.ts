import { useQuery } from "@tanstack/react-query";
import type { Song } from "feature/songs/types/songs.type";
import { calculateAverageDifficulty } from "feature/songs/utils/difficulty.utils";
import { collection, documentId, query, where } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDocs } from "utils/firebase/client/firestoreTracking";

export type SongTierInfo = Pick<Song, "tier" | "avgDifficulty">;

/** Firestore `in` queries accept at most 10 ids per query. */
const CHUNK_SIZE = 10;

const getSongTiersByIds = async (
  songIds: string[]
): Promise<Record<string, SongTierInfo>> => {
  const chunks: string[][] = [];
  for (let i = 0; i < songIds.length; i += CHUNK_SIZE) {
    chunks.push(songIds.slice(i, i + CHUNK_SIZE));
  }

  const songsRef = collection(db, "songs");
  const snapshots = await Promise.all(
    chunks.map((chunk) =>
      trackedGetDocs(query(songsRef, where(documentId(), "in", chunk)))
    )
  );

  const tiers: Record<string, SongTierInfo> = {};
  snapshots.forEach((snap) => {
    snap.docs.forEach((docSnap) => {
      const data = docSnap.data() as Song;
      const avgDifficulty =
        data.avgDifficulty ?? calculateAverageDifficulty(data.difficulties || []);
      tiers[docSnap.id] = { tier: data.tier, avgDifficulty };
    });
  });

  return tiers;
};

/**
 * Tier/difficulty lookup for songs referenced by id (e.g. activity-feed log
 * entries, which only carry title/artist/id). Missing ids are simply absent
 * from the returned map (deleted songs, legacy logs).
 */
export const useSongTiers = (songIds: string[]): Record<string, SongTierInfo> => {
  const uniqueIds = [...new Set(songIds)].sort();

  const { data } = useQuery({
    queryKey: ["song-tiers", uniqueIds],
    queryFn: () => getSongTiersByIds(uniqueIds),
    enabled: uniqueIds.length > 0,
    staleTime: 30 * 60 * 1000,
  });

  return data ?? {};
};
