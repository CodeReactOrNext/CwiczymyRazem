import { deleteDoc, doc, updateDoc, arrayRemove, increment } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const removeUserSong = async (userId: string, songId: string) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userSongRef = doc(userDocRef, "userSongs", songId);

    const songRef = doc(db, "songs", songId);
    await updateDoc(songRef, {
      practicingUsers: arrayRemove(userId),
      popularity: increment(-1)
    }).catch(err => console.error("Error updating popularity on remove:", err));

    await deleteDoc(userSongRef);

    return true;
  } catch (error) {
    console.error("Error removing song:", error);
    throw error;
  }
};