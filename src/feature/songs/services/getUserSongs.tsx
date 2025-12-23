import type { Song, SongStatus } from "feature/songs/types/songs.type";
import {
  collection,
  doc,
  getDocs,
  Timestamp,
  getDoc,
  query,
  where,
  documentId,
  updateDoc,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDocs, trackedGetDoc } from "utils/firebase/client/firestoreTracking";

const getAverageDifficulty = (difficulties: { rating: number }[]) => {
  if (!difficulties?.length) return 0;
  return (
    difficulties.reduce((acc, curr) => acc + curr.rating, 0) /
    difficulties.length
  );
};

export const getUserSongs = async (userId: string) => {
  console.log(`[getUserSongs.DEBUG] userId: ${userId}`);
  const userDocRef = doc(db, "users", userId);
  const userSongsRef = collection(userDocRef, "userSongs");
  console.log(`[getUserSongs.DEBUG] userSongsRef:`, userSongsRef);

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

    // Batched fetching of song details
    const songIds = userSongs.map((us) => us.id);
    const CHUNK_SIZE = 10;
    const songChunks = [];
    for (let i = 0; i < songIds.length; i += CHUNK_SIZE) {
      songChunks.push(songIds.slice(i, i + CHUNK_SIZE));
    }

    const songsRef = collection(db, "songs");
    const fullSongsQueries = songChunks.map((chunk) => {
      return query(songsRef, where(documentId(), "in", chunk));
    });

    const fullSongsSnapshots = await Promise.all(fullSongsQueries.map(q => trackedGetDocs(q)));
    const idToSongMap = new Map<string, Song>();

    fullSongsSnapshots.forEach((snap) => {
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data() as Song;
        const avgDifficulty = data.avgDifficulty !== undefined 
          ? data.avgDifficulty 
          : getAverageDifficulty(data.difficulties || []);

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
