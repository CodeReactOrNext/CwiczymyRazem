import { useQuery } from "@tanstack/react-query";
import { getAllUserSongProgress } from "feature/songs/services/userSongProgress.service";

/**
 * Milliseconds the player has spent on each song, keyed by song id. One query
 * for the whole profile; a failed read (the progress docs may be closed to
 * visitors) leaves the map empty and the profile simply shows no times.
 */
export const useSongPracticeTimes = (userId: string) => {
  const { data } = useQuery({
    queryKey: ["profile-song-practice-times", userId],
    queryFn: async () => {
      try {
        const progress = await getAllUserSongProgress(userId);
        return Object.fromEntries(
          progress.map((entry) => [entry.songId, entry.totalPracticeMs ?? 0]),
        ) as Record<string, number>;
      } catch {
        return {} as Record<string, number>;
      }
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });
  return data ?? {};
};
