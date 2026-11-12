import axios from "axios";
import { auth, firebaseGetCurrentUser } from "utils/firebase/client/firebase.utils";

/** Song id → recording length in ms, for the songs whose length is known. */
export type SongDurations = Record<string, number>;

export const fetchSongDurations = async (
  songIds: readonly string[],
): Promise<SongDurations> => {
  if (songIds.length === 0) return {};
  const user = auth.currentUser ?? (await firebaseGetCurrentUser());
  if (!user) return {};
  const idToken = await user.getIdToken();
  const { data } = await axios.post<{ durations: SongDurations }>(
    "/api/songs/durations",
    { idToken, songIds },
  );
  return data.durations ?? {};
};
