import { firebaseAddSongsLog } from "feature/logs/services/addSongsLog.service";
import type { SongStatus } from "feature/songs/types/songs.type";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const updateSongStatus = async (
  userId: string,
  songId: string,
  title: string,
  artist: string,
  status: SongStatus
) => {
  const userDocRef = doc(db, "users", userId);
  const userSongsRef = doc(userDocRef, "userSongs", songId);

  try {
    await setDoc(userSongsRef, {
      songId,
      status,
      title,
      artist,
      lastUpdated: Timestamp.now(),
    });

    firebaseAddSongsLog(
      userId,
      new Date().toISOString(),
      title,
      artist,
      status
    );
    return true;
  } catch (error) {
    console.error("Error updating song status:", error);
    throw error;
  }
};
