import { firebaseAddSongsLog } from "feature/logs/services/addSongsLog.service";
import { addDoc, collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

const checkSongExists = async (title: string, artist: string) => {
  try {
    const songsRef = collection(db, "songs");
    const q = query(
      songsRef,
      where("title", "==", title),
      where("artist", "==", artist)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking for duplicate song:", error);
    throw error;
  }
};

const getTierFromDifficulty = (difficulty: number): string => {
  if (difficulty >= 9) return "S";
  if (difficulty >= 7.5) return "A";
  if (difficulty >= 6) return "B";
  if (difficulty >= 4) return "C";
  return "D";
};


export const addSong = async (
  title: string,
  artist: string,
  userId: string,
  avatarUrl: string | undefined,
  difficulty_rate: number | undefined
) => {
  try {
    const exists = await checkSongExists(title, artist);
    if (exists) {
      throw new Error("song_already_exists");
    }

    const songsRef = collection(db, "songs");
    const newSong = {
      title,
      artist,
      title_lowercase: title.toLowerCase(),
      artist_lowercase: artist.toLowerCase(),
      createdAt: Timestamp.now(),
      createdBy: userId,
      difficulties: [],
      avgDifficulty: 0,
      tier: "D",
      isVerified: false,
      coverUrl: null,
    };

    const docRef = await addDoc(songsRef, newSong);
    firebaseAddSongsLog(
      userId,
      new Date().toISOString(),
      title,
      artist,
      "added",
      avatarUrl,
      difficulty_rate
    );
    return docRef.id;
  } catch (error) {
    console.error("Error adding song:", error);
    throw error;
  }
};
