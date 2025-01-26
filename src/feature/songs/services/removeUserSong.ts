import { deleteDoc, doc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const removeUserSong = async (userId: string, songId: string) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userSongRef = doc(userDocRef, "userSongs", songId);

    await deleteDoc(userSongRef);

    return true;
  } catch (error) {
    console.error("Error removing song:", error);
    throw error;
  }
};