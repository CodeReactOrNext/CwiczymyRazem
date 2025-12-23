import type { Song, SongStatus } from "feature/songs/types/songs.type";
import {
  collection,
  doc,
  Timestamp,
  query,
  where,
  documentId,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDocs } from "utils/firebase/client/firestoreTracking";
import { calculateAverageDifficulty } from "../utils/difficulty.utils";

export const getUserSongs = async (userId: string) => {
  const userDocRef = doc(db, "users", userId);
  const userSongsRef = collection(userDocRef, "userSongs");

  try {
    const userSongsSnapshot = await trackedGetDocs(userSongsRef);
    const songLists = {
      wantToLearn: [] as Song[],
      learning: [] as Song[],
      learned: [] as Song[],
      lastUpdated: Timestamp.now(),
    };

    const userSongs = userSongsSnapshot.docs.map((docSnap) => ({
      id: docSnap.data().songId,
      status: docSnap.data().status as SongStatus,
    }));

    if (userSongs.length === 0) return songLists;

    const songIds = userSongs.map((us) => us.id);
    const CHUNK_SIZE = 10;
    const songChunks = [];
    for (let i = 0; i < songIds.length; i += CHUNK_SIZE) {
      songChunks.push(songIds.slice(i, i + CHUNK_SIZE));
    }

    const songsRef = collection(db, "songs");
    const fullSongsSnapshots = await Promise.all(
      songChunks.map((chunk) => trackedGetDocs(query(songsRef, where(documentId(), "in", chunk))))
    );
    
    const idToSongMap = new Map<string, Song>();

    fullSongsSnapshots.forEach((snap) => {
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data() as Song;
        const avgDifficulty = data.avgDifficulty !== undefined 
          ? data.avgDifficulty 
          : calculateAverageDifficulty(data.difficulties || []);

        idToSongMap.set(docSnap.id, { 
          ...data,
          id: docSnap.id,
          avgDifficulty 
        } as Song);
      });
    });

    userSongs.forEach((us) => {
      const fullSong = idToSongMap.get(us.id);
      if (fullSong) {
        if (us.status === "wantToLearn") songLists.wantToLearn.push(fullSong);
        else if (us.status === "learning") songLists.learning.push(fullSong);
        else if (us.status === "learned") songLists.learned.push(fullSong);
      }
    });

    return songLists;
  } catch (error) {
    console.error("Error getting user songs:", error);
    throw error;
  }
};
