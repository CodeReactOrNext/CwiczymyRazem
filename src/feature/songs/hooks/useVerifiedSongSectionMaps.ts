import { useQuery } from "@tanstack/react-query";
import { getVerifiedSongSectionMaps } from "feature/songs/services/songSectionMap.service";
import type { SongSectionMap } from "feature/songs/types/songSectionMap.type";
import { useMemo } from "react";

/**
 * Every community-verified section map, keyed by songId (best — i.e. most
 * contributors — kept when a song has verified maps for more than one video).
 * One shared query for the whole app: cheap enough to fetch in full and reuse
 * for both the "community map available" badge on song rows and the import
 * banner inside a practice session.
 */
export const useVerifiedSongSectionMaps = () => {
  const query = useQuery({
    queryKey: ["verified-song-section-maps"],
    queryFn: getVerifiedSongSectionMaps,
    staleTime: 5 * 60 * 1000,
  });

  const bySongId = useMemo(() => {
    const map = new Map<string, SongSectionMap>();
    for (const entry of query.data ?? []) {
      const existing = map.get(entry.songId);
      if (!existing || entry.contributorCount > existing.contributorCount) {
        map.set(entry.songId, entry);
      }
    }
    return map;
  }, [query.data]);

  return { ...query, bySongId };
};
