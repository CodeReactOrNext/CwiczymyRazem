import { writeBatch, doc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import type { Song } from "feature/songs/types/songs.type";

export const updateUserSongOrder = async (userId: string, songs: Song[]) => {
  const batch = writeBatch(db);
  const userDocRef = doc(db, "users", userId);

  songs.forEach((song, index) => {
    const userSongRef = doc(userDocRef, "userSongs", song.id);
    batch.update(userSongRef, { order: index });
  });

  try {
    await batch.commit();
  } catch (error) {
    console.error("Error updating song order:", error);
    throw error;
  }
};
