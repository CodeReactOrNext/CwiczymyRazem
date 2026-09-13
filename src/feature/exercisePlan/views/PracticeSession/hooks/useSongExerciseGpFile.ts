import { useQuery } from "@tanstack/react-query";
import { getUserSongProgress } from "feature/songs/services/userSongProgress.service";
import { doc, getDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

interface SongGpFile {
  downloadUrl: string;
  fileName: string;
}

/**
 * The Guitar Pro file the player attached to a song (on the song's own
 * practice page), or null when there is none.
 */
export const resolveSongGpFile = async (
  userId: string,
  songId: string
): Promise<SongGpFile | null> => {
  const progress = await getUserSongProgress(userId, songId);
  if (!progress?.gpFileId || !progress.gpFileName) return null;

  const gpFileSnap = await getDoc(doc(db, "users", userId, "gpFiles", progress.gpFileId));
  if (!gpFileSnap.exists()) return null;

  const { downloadUrl } = gpFileSnap.data() as { downloadUrl?: string };
  return downloadUrl ? { downloadUrl, fileName: progress.gpFileName } : null;
};

/**
 * Resolves the tab for a song placed in a routine: the same file the song's own
 * practice page would load. Idle for anything that is not a song item.
 *
 * `isResolving` covers the lookup itself, so the session can hold its loading
 * overlay instead of flashing the tab-less song panel for a moment before the
 * notation appears.
 */
export function useSongExerciseGpFile(songId: string | undefined, userId: string | null) {
  const enabled = !!songId && !!userId;

  const { data, isPending } = useQuery({
    queryKey: ["song-exercise-gp-file", userId, songId],
    queryFn: () => resolveSongGpFile(userId as string, songId as string),
    enabled,
    staleTime: 5 * 60 * 1000,
    // A song whose file could not be read is a song without a tab, not a
    // broken session.
    retry: false,
  });

  return {
    gpFileUrl: enabled ? data?.downloadUrl : undefined,
    isResolving: enabled && isPending,
  };
}
