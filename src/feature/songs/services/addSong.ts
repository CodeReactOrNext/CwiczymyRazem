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


export const addSong = async (
  title: string,
  artist: string,
  userId: string
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
      createdAt: Timestamp.now(),
      createdBy: userId,
      difficulties: [],
    };

    const docRef = await addDoc(songsRef, newSong);
    firebaseAddSongsLog(
      userId,
      new Date().toISOString(),
      title,
      artist,
      "added"
    );
    return docRef.id;
  } catch (error) {
    console.error("Error adding song:", error);
    throw error;
  }
};
