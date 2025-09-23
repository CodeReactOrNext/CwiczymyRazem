import type { Song, SongStatus } from "feature/songs/types/songs.type";
import {
  collection,
  doc,
  getDocs,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const getUserSongs = async (userId: string) => {
  const userDocRef = doc(db, "users", userId);
  const userSongsRef = collection(userDocRef, "userSongs");

  try {
    const userSongsSnapshot = await getDocs(userSongsRef);
    const songLists = {
      wantToLearn: [] as Song[],
      learning: [] as Song[],
      learned: [] as Song[],
      lastUpdated: Timestamp.now(),
    };

    const userSongs = userSongsSnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.data().songId,
    }));

    // Pobierz pełne dane utworów z kolekcji songs
    for (const userSong of userSongs) {
      try {
        const songDocRef = doc(db, "songs", userSong.id);
        const songDoc = await getDoc(songDocRef);

        if (songDoc.exists()) {
          const fullSongData = {
            ...songDoc.data(),
            id: songDoc.id,
          } as Song;

          // Dodaj do odpowiedniej listy na podstawie statusu
          if (userSong.status === "wantToLearn") {
            songLists.wantToLearn.push(fullSongData);
          } else if (userSong.status === "learning") {
            songLists.learning.push(fullSongData);
          } else if (userSong.status === "learned") {
            songLists.learned.push(fullSongData);
          }
        }
      } catch (error) {
        console.error(`Error fetching song ${userSong.id}:`, error);
      }
    }

    return songLists;
  } catch (error) {
    console.error("Error getting user songs:", error);
    throw error;
  }
};
