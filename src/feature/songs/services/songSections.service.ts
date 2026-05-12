import type { SongSection } from "feature/songs/types/songSection.type";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

interface UserSongMeta {
  youtubeUrl?: string;
  sections?: SongSection[];
  notes?: string;
}

export const getUserSongMeta = async (
  userId: string,
  songId: string
): Promise<UserSongMeta> => {
  const ref = doc(db, "users", userId, "userSongs", songId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return {};
  const data = snap.data();
  return {
    youtubeUrl: data.youtubeUrl ?? undefined,
    sections: data.sections ?? [],
    notes: data.notes ?? "",
  };
};

export const saveUserSongMeta = async (
  userId: string,
  songId: string,
  data: UserSongMeta
): Promise<void> => {
  const ref = doc(db, "users", userId, "userSongs", songId);
  await setDoc(ref, data, { merge: true });
};
