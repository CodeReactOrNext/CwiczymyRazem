import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { collection, doc, getDocs, Timestamp } from "firebase/firestore";
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

    userSongs.forEach((song: { status?: SongStatus } & { id: any }) => {
      if (song.status === "wantToLearn")
        songLists.wantToLearn.push(song as Song);
      if (song.status === "learning") songLists.learning.push(song as Song);
      if (song.status === "learned") songLists.learned.push(song as Song);
    });

    return songLists;
  } catch (error) {
    console.error("Error getting user songs:", error);
    throw error;
  }
};
