import { useQuery } from "@tanstack/react-query";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import type { Song } from "feature/songs/types/songs.type";

export interface UserSongLists {
  wantToLearn: Song[];
  learning: Song[];
  learned: Song[];
}

/**
 * getUserSongs reads through the client Firestore SDK (WebChannel). On networks
 * where that transport stalls the promise never settles, so every attempt is
 * bounded — otherwise a profile sits forever on a song tier that looks like a
 * real answer ("?") but is really "still loading".
 */
const FETCH_TIMEOUT = 10000;

const fetchUserSongs = async (userId: string): Promise<UserSongLists> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("getUserSongs timeout")), FETCH_TIMEOUT),
  );
  return Promise.race([getUserSongs(userId), timeout]);
};

/**
 * Song lists of any user — the signed-in one or the owner of the profile being
 * viewed. Keyed by user id, so opening someone else's profile fetches their
 * songs instead of keeping whoever was loaded first (profile pages swap the id
 * without remounting), and shared with the other ["user-songs", id] queries —
 * song board, achievements — so it usually costs no extra request.
 */
export const useUserSongs = (userId: string | undefined | null) => {
  const { data, isPending, isError } = useQuery({
    queryKey: ["user-songs", userId],
    queryFn: () => fetchUserSongs(userId as string),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  return {
    songs: data,
    // Without an id there is nothing to wait for, and a failed fetch is an
    // answer of its own — callers tell a skeleton from an honest empty state.
    isLoading: !!userId && isPending,
    isError,
  };
};
