import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import type { Song } from "feature/songs/types/songs.type";

export const getDailyRecommendation = async (ownedSongIds: string[]): Promise<Song | null> => {
  try {
    const songsRef = collection(db, "songs");
    // Only recommend verified songs for a better experience
    const q = query(songsRef, where("isVerified", "==", true));
    const snapshot = await getDocs(q);

    let allSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song));

    // Filter out songs the user already has
    const availableSongs = allSongs.filter(song => !ownedSongIds.includes(song.id));

    if (availableSongs.length === 0) return null;

    // Generate a deterministic index based on the current date
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

    // Simple hash function for the date string
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      const char = dateString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    const index = Math.abs(hash) % availableSongs.length;
    return availableSongs[index];
  } catch (error) {
    console.error("Error getting daily recommendation:", error);
    return null;
  }
};
