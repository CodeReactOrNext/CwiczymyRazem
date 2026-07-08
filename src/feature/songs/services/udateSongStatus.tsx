import { firebaseAddSongsLog } from "feature/logs/services/addSongsLog.service";
import { updateSeasonalPoints } from "feature/report/services/updateSeasonalPoints";
import type { SongStatus } from "feature/songs/types/songs.type";
import { arrayUnion, doc, getDoc, increment,setDoc, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

const LEARNED_POINTS = 40;
// Minimum accumulated practice time on a song before marking it as
// "learned" awards points. Prevents gaming points by flipping the status.
const MIN_PRACTICE_MS_FOR_POINTS = 10 * 60 * 1000;

export const updateSongStatus = async (
  userId: string,
  songId: string,
  title: string,
  artist: string,
  status: SongStatus,
  avatarUrl: string | undefined
) => {
  const userDocRef = doc(db, "users", userId);
  const userSongsRef = doc(userDocRef, "userSongs", songId);

  try {
    // 1. Sync with Song document for popularity
    const songRef = doc(db, "songs", songId);
    const songSnap = await getDoc(songRef);
    
    if (songSnap.exists()) {
      const songData = songSnap.data();
      const practicingUsers = songData.practicingUsers || [];
      
      if (!practicingUsers.includes(userId)) {
        await updateDoc(songRef, {
          practicingUsers: arrayUnion(userId),
          popularity: increment(1)
        });
      }
    }

    // 2. Fetch current status to handle point changes
    const currentStatusSnap = await getDoc(userSongsRef);
    const currentData = currentStatusSnap.exists() ? currentStatusSnap.data() : null;
    const oldStatus = currentData?.status ?? null;
    // Whether points were actually granted for this song previously. Used so we
    // only ever reverse points we really awarded.
    const pointsPreviouslyAwarded = currentData?.pointsAwarded === true;

    let pointsAdded = 0;
    let pointsAwarded = pointsPreviouslyAwarded;
    // Set when the status moved to "learned" but the practice-time threshold
    // was not met, so the caller can explain why no points were granted.
    let insufficientPracticeTime = false;

    if (status === "learned" && oldStatus !== "learned") {
      // Only award points once the user has practised this song long enough.
      const progressSnap = await getDoc(doc(userDocRef, "songProgress", songId));
      const totalPracticeMs = progressSnap.exists()
        ? progressSnap.data().totalPracticeMs ?? 0
        : 0;

      if (totalPracticeMs >= MIN_PRACTICE_MS_FOR_POINTS) {
        await updateDoc(userDocRef, {
          "statistics.points": increment(LEARNED_POINTS)
        });
        pointsAdded = LEARNED_POINTS;
        pointsAwarded = true;
        await updateSeasonalPoints(userId, LEARNED_POINTS);
      } else {
        insufficientPracticeTime = true;
      }
    } else if (oldStatus === "learned" && status !== "learned") {
      if (pointsPreviouslyAwarded) {
        await updateDoc(userDocRef, {
          "statistics.points": increment(-LEARNED_POINTS)
        });
        pointsAdded = -LEARNED_POINTS;
        await updateSeasonalPoints(userId, -LEARNED_POINTS);
      }
      pointsAwarded = false;
    }

    await setDoc(userSongsRef, {
      songId,
      status,
      title,
      artist,
      pointsAwarded,
      lastUpdated: Timestamp.now(),
    }, { merge: true });

    firebaseAddSongsLog(
      userId,
      new Date().toISOString(),
      title,
      artist,
      status,
      avatarUrl,
      undefined,
      songId
    );
    return { success: true, pointsAdded, insufficientPracticeTime };
  } catch (error) {
    console.error("Error updating song status:", error);
    throw error;
  }
};
