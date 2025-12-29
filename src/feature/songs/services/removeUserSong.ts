import { deleteDoc, doc, updateDoc, arrayRemove, increment, getDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const removeUserSong = async (userId: string, songId: string) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userSongRef = doc(userDocRef, "userSongs", songId);

    const songRef = doc(db, "songs", songId);
    
    // 1. Fetch current status to handle point changes
    const currentStatusSnap = await getDoc(userSongRef);
    const oldStatus = currentStatusSnap.exists() ? currentStatusSnap.data().status : null;

    // 2. Handle Points
    let pointsAdded = 0;
    if (oldStatus === "learned") {
      await updateDoc(userDocRef, {
        "statistics.points": increment(-200)
      });
      pointsAdded = -200;
    }

    await updateDoc(songRef, {
      practicingUsers: arrayRemove(userId),
      popularity: increment(-1)
    }).catch(err => console.error("Error updating popularity on remove:", err));

    await deleteDoc(userSongRef);

    return { success: true, pointsAdded };
  } catch (error) {
    console.error("Error removing song:", error);
    throw error;
  }
};