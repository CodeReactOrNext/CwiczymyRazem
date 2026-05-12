import type { Song, SongStatus } from "feature/songs/types/songs.type";
import {
  collection,
  doc,
  documentId,
  query,
  Timestamp,
  where,
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

    const userSongs = userSongsSnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const sections = data.sections || [];
      const weights: Record<number, number> = { 0: 0, 1: 0.2, 2: 0.5, 3: 1, 4: 0 };
      const totalWeighted = sections.reduce((acc: number, s: any) => acc + (weights[s.mastery] ?? 0), 0);
      const masteryProgress = sections.length > 0 ? Math.round((totalWeighted / sections.length) * 100) : 0;

      return {
        id: data.songId,
        status: data.status as SongStatus,
        order: data.order ?? 0,
        masteryProgress,
        totalSections: sections.length
      };
    }).sort((a, b) => a.order - b.order);

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
        const songWithProgress = {
          ...fullSong,
          masteryProgress: us.masteryProgress,
          totalSections: us.totalSections
        };
        if (us.status === "wantToLearn") songLists.wantToLearn.push(songWithProgress);
        else if (us.status === "learning") songLists.learning.push(songWithProgress);
        else if (us.status === "learned") songLists.learned.push(songWithProgress);
      }
    });

    return songLists;
  } catch (error) {
    console.error("Error getting user songs:", error);
    throw error;
  }
};
