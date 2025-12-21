import type { Song } from "feature/songs/types/songs.type";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

const getAverageDifficulty = (difficulties: { rating: number }[]) => {
  if (!difficulties?.length) return 0;
  return (
    difficulties.reduce((acc, curr) => acc + curr.rating, 0) /
    difficulties.length
  );
};

export const getSongs = async (
  sortBy: string,
  sortDirection: "asc" | "desc",
  searchQuery: string,
  page: number,
  itemsPerPage: number,
  tier?: string,
  difficultyFilter?: string
) => {
  try {
    const songsRef = collection(db, "songs");
    let q = query(songsRef);

    // 1. Firestore-Native Search (prefix search on lowercase field)
    if (searchQuery) {
      const lowerSearch = searchQuery.toLowerCase();
      q = query(
        q,
        where("title_lowercase", ">=", lowerSearch),
        where("title_lowercase", "<=", lowerSearch + "\uf8ff")
      );
    }

    // 2. Firestore-Native Tier Filtering
    if (tier && tier !== "all") {
      if (tier === "S") q = query(q, where("avgDifficulty", ">=", 9));
      else if (tier === "A") q = query(q, where("avgDifficulty", ">=", 7.5), where("avgDifficulty", "<", 9));
      else if (tier === "B") q = query(q, where("avgDifficulty", ">=", 6), where("avgDifficulty", "<", 7.5));
      else if (tier === "C") q = query(q, where("avgDifficulty", ">=", 4), where("avgDifficulty", "<", 6));
      else if (tier === "D") q = query(q, where("avgDifficulty", "<", 4));
    }

    // 3. Firestore-Native Difficulty Filtering
    if (difficultyFilter && difficultyFilter !== "all") {
      if (difficultyFilter === "easy") q = query(q, where("avgDifficulty", "<=", 4));
      else if (difficultyFilter === "medium") q = query(q, where("avgDifficulty", ">", 4), where("avgDifficulty", "<=", 7));
      else if (difficultyFilter === "hard") q = query(q, where("avgDifficulty", ">", 7));
    }

    // Note: Combining multiple range/inequality filters in Firestore requires composite indexes.
    // If the query fails due to missing index, it will throw an error with a link to create it.

    const snapshot = await getDocs(q);
    let songs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Song));

    // Background Hydration: update documents missing helper fields
    songs.forEach((song) => {
      if (song.avgDifficulty === undefined || song.title_lowercase === undefined) {
        const avg = getAverageDifficulty(song.difficulties || []);
        updateDoc(doc(db, "songs", song.id), {
          avgDifficulty: avg,
          title_lowercase: song.title.toLowerCase(),
          artist_lowercase: song.artist.toLowerCase(),
        }).catch(err => console.error("Hyration failure:", err));

        // Update current object for immediate correct sorting/display
        song.avgDifficulty = avg;
        song.title_lowercase = song.title.toLowerCase();
      }
    });

    // 4. Client-side Sorting & Paging (on the filtered result set)
    // We do sorting here to handle cases where we can't do it on DB (e.g. combined filters without index)
    songs.sort((a: any, b: any) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (sortDirection === "asc") return valA > valB ? 1 : -1;
      else return valA < valB ? 1 : -1;
    });

    const total = songs.length;
    const startIndex = (page - 1) * itemsPerPage;
    const pagedSongs = songs.slice(startIndex, startIndex + itemsPerPage);

    return {
      songs: pagedSongs,
      total,
    };
  } catch (error) {
    console.error("Error getting songs:", error);
    throw error;
  }
};
