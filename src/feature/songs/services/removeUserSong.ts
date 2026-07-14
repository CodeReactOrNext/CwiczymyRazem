import { updateSeasonalPoints } from "feature/report/services/updateSeasonalPoints";
import { LEARNED_POINTS } from "feature/songs/services/udateSongStatus";
import { arrayRemove, deleteDoc, doc, getDoc, increment, updateDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const removeUserSong = async (userId: string, songId: string) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userSongRef = doc(userDocRef, "userSongs", songId);

    const songRef = doc(db, "songs", songId);

    // 1. Fetch current status to handle point changes. Points are only reversed
    // when they were actually awarded (see udateSongStatus.tsx) — a song can be
    // "learned" without points if the practice-time threshold wasn't met, and
    // subtracting unconditionally on delete would push the user's total negative.
    const currentStatusSnap = await getDoc(userSongRef);
    const currentData = currentStatusSnap.exists() ? currentStatusSnap.data() : null;
    const oldStatus = currentData?.status ?? null;
    const pointsPreviouslyAwarded = currentData?.pointsAwarded === true;

    // 2. Handle Points
    let pointsAdded = 0;
    if (oldStatus === "learned" && pointsPreviouslyAwarded) {
      await updateDoc(userDocRef, {
        "statistics.points": increment(-LEARNED_POINTS)
      });
      pointsAdded = -LEARNED_POINTS;
      await updateSeasonalPoints(userId, -LEARNED_POINTS);
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