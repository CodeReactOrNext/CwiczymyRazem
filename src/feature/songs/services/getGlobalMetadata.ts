import { doc, getDoc } from "firebase/firestore";
import { memoryCache } from "utils/cache/memoryCache";
import { db } from "utils/firebase/client/firebase.utils";

const GENRES_CACHE_KEY = "global_genres";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export const getGlobalGenres = async (): Promise<string[]> => {
  const cached = memoryCache.get(GENRES_CACHE_KEY);
  if (cached) return cached;

  try {
    const metaRef = doc(db, "metadata", "global");
    const metaSnap = await getDoc(metaRef);

    if (metaSnap.exists()) {
      const genres = (metaSnap.data().genres || []).sort();
      memoryCache.set(GENRES_CACHE_KEY, genres, CACHE_TTL);
      return genres;
    }
    return [];
  } catch (error) {
    console.error("Error getting global genres:", error);
    return [];
  }
};
