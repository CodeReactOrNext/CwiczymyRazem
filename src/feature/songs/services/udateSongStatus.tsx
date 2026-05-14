import { firebaseAddSongsLog } from "feature/logs/services/addSongsLog.service";
import { updateSeasonalPoints } from "feature/report/services/updateSeasonalPoints";
import type { SongStatus } from "feature/songs/types/songs.type";
import { arrayUnion, doc, getDoc, increment,setDoc, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

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
    const oldStatus = currentStatusSnap.exists() ? currentStatusSnap.data().status : null;

    let pointsAdded = 0;
    if (status === "learned" && oldStatus !== "learned") {
      await updateDoc(userDocRef, {
        "statistics.points": increment(100)
      });
      pointsAdded = 100;
      await updateSeasonalPoints(userId, 100);
    } else if (oldStatus === "learned" && status !== "learned") {
      await updateDoc(userDocRef, {
        "statistics.points": increment(-100)
      });
      pointsAdded = -100;
      await updateSeasonalPoints(userId, -100);
    }

    await setDoc(userSongsRef, {
      songId,
      status,
      title,
      artist,
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
    return { success: true, pointsAdded };
  } catch (error) {
    console.error("Error updating song status:", error);
    throw error;
  }
};
