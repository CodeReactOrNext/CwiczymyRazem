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
  tierFilters?: string[],
  difficultyFilter?: string,
  genreFilters?: string[]
) => {
  try {
    const songsRef = collection(db, "songs");
    let q = query(songsRef);

    // 0. Base Filtering (Firestore-Native)
    // We only do simple filters on DB to avoid complex index requirements for multi-select
    if (difficultyFilter && difficultyFilter !== "all") {
      if (difficultyFilter === "easy") q = query(q, where("avgDifficulty", "<=", 4));
      else if (difficultyFilter === "medium") q = query(q, where("avgDifficulty", ">", 4), where("avgDifficulty", "<=", 7));
      else if (difficultyFilter === "hard") q = query(q, where("avgDifficulty", ">", 7));
    }

    // 1. Fetch Candidates
    const snapshot = await getDocs(q);
    let songs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Song));

    // 2. Client-side Multi-select Filtering (Tier)
    if (tierFilters && tierFilters.length > 0) {
      songs = songs.filter(song => {
        const diff = song.avgDifficulty ?? 0;
        return tierFilters.some(tier => {
          if (tier === "S") return diff >= 9;
          if (tier === "A") return diff >= 7.5 && diff < 9;
          if (tier === "B") return diff >= 6 && diff < 7.5;
          if (tier === "C") return diff >= 4 && diff < 6;
          if (tier === "D") return diff < 4;
          return false;
        });
      });
    }

    // 3. Client-side Multi-select Filtering (Genre)
    if (genreFilters && genreFilters.length > 0) {
      songs = songs.filter(song => {
        if (!song.genres || !song.genres.length) return false;
        // Check if item has ANY of the selected genres
        return genreFilters.some(g => song.genres?.includes(g));
      });
    }

    // Background Hydration: update documents missing helper fields or search_string
    songs.forEach((song) => {
      const title = song.title || "";
      const artist = song.artist || "";
      const searchStr = `${title} ${artist}`.toLowerCase();

      if (song.avgDifficulty === undefined || song.title_lowercase === undefined || song.search_string === undefined) {
        const avg = getAverageDifficulty(song.difficulties || []);
        updateDoc(doc(db, "songs", song.id), {
          avgDifficulty: avg,
          title_lowercase: title.toLowerCase(),
          artist_lowercase: artist.toLowerCase(),
          search_string: searchStr
        }).catch(err => console.error("Hyration failure:", err));

        // Update current object
        song.avgDifficulty = avg;
        song.title_lowercase = title.toLowerCase();
        song.search_string = searchStr;
      }
    });

    // 4. Client-side Search Filtering
    if (searchQuery) {
      const lowerSearch = searchQuery.toLowerCase();
      songs = songs.filter(song => {
        const titleMatch = (song.title || "").toLowerCase().includes(lowerSearch);
        const artistMatch = (song.artist || "").toLowerCase().includes(lowerSearch);
        return titleMatch || artistMatch;
      });
    }

    // 5. Client-side Sorting & Paging
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
