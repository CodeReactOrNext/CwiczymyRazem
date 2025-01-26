import { firebaseAddSongsLog } from "feature/logs/services/addSongsLog.service";
import type { Song } from "feature/songs/types/songs.type";
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const rateSongDifficulty = async (
  songId: string,
  userId: string,
  rating: number,
  title: string,
  artist: string
) => {
  try {
    const songRef = doc(db, "songs", songId);
    const songDoc = await getDoc(songRef);

    if (!songDoc.exists()) {
      throw new Error("Song not found");
    }

    const song = songDoc.data() as Song;
    const difficulties = song.difficulties || [];

    const filteredDifficulties = difficulties.filter(
      (d) => d.userId !== userId
    );

    const newDifficulties = [
      ...filteredDifficulties,
      {
        userId,
        rating,
        date: Timestamp.now(),
      },
    ];

    await updateDoc(songRef, {
      difficulties: newDifficulties,
    });

    firebaseAddSongsLog(
      userId,
      new Date().toISOString(),
      title,
      artist,
      "difficulty_rate",
      rating
    );
  } catch (error) {
    console.error("Error rating song:", error);
    throw error;
  }
};
