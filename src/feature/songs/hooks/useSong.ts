import { useQuery } from "@tanstack/react-query";
import { getSongById } from "feature/songs/services/getSongs";

/**
 * One song by id. For screens that only hold a denormalised snapshot
 * (title, artist, cover) and need the full doc on demand — the challenge board
 * and the ballot fetch it this way to get at `spotifyId` for the preview.
 */
export const useSong = (songId: string | null | undefined) =>
  useQuery({
    queryKey: ["song", songId],
    queryFn: () => getSongById(songId as string),
    enabled: !!songId,
    staleTime: 5 * 60 * 1000,
  });
