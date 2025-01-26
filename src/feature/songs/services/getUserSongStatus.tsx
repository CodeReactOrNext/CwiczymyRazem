import type { SongStatus } from "feature/songs/types/songs.type";
import { doc, getDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const getUserSongStatus = async (userId: string, songId: string) => {
  const userDocRef = doc(db, "users", userId);
  const userSongRef = doc(userDocRef, "userSongs", songId);

  try {
    const userSongDoc = await getDoc(userSongRef);
    if (!userSongDoc.exists()) return null;

    return userSongDoc.data().status as SongStatus;
  } catch (error) {
    console.error("Error getting song status:", error);
    throw error;
  }
};
