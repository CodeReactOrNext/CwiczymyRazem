import type { Song } from "feature/songs/types/songs.type";
import {
  collection,
  query,
  where,
  doc,
  orderBy,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { memoryCache } from "utils/cache/memoryCache";
import { trackedGetDocs } from "utils/firebase/client/firestoreTracking";

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
    const hasFilters =
      searchQuery ||
      (tierFilters && tierFilters.length > 0) ||
      (difficultyFilter && difficultyFilter !== "all") ||
      (genreFilters && genreFilters.length > 0);

    const cacheKey = JSON.stringify({
      sortBy,
      sortDirection,
      page,
      itemsPerPage,
    });

    if (!hasFilters) {
      const cached = memoryCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const songsRef = collection(db, "songs");
    let q = query(songsRef);

    if (difficultyFilter && difficultyFilter !== "all") {
      if (difficultyFilter === "easy") q = query(q, where("avgDifficulty", "<=", 4));
      else if (difficultyFilter === "medium") q = query(q, where("avgDifficulty", ">", 4), where("avgDifficulty", "<=", 7));
      else if (difficultyFilter === "hard") q = query(q, where("avgDifficulty", ">", 7));

      q = query(q, orderBy("avgDifficulty", "asc"));
    }

    const snapshot = await trackedGetDocs(q);
    let songs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Song));

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

    if (genreFilters && genreFilters.length > 0) {
      songs = songs.filter(song => {
        if (!song.genres || !song.genres.length) return false;
        return genreFilters.some(g => song.genres?.includes(g));
      });
    }

    if (searchQuery) {
      const lowerSearch = searchQuery.toLowerCase();
      songs = songs.filter(song => {
        const titleMatch = (song.title || "").toLowerCase().includes(lowerSearch);
        const artistMatch = (song.artist || "").toLowerCase().includes(lowerSearch);
        return titleMatch || artistMatch;
      });
    }

    songs.sort((a: any, b: any) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'popularity' || sortBy === 'avgDifficulty') {
        valA = typeof valA === 'number' ? valA : 0;
        valB = typeof valB === 'number' ? valB : 0;
      }

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA === valB) return 0;

      if (sortDirection === "asc") {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });

    const total = songs.length;
    const startIndex = (page - 1) * itemsPerPage;
    const pagedSongs = songs.slice(startIndex, startIndex + itemsPerPage);

    const result = {
      songs: pagedSongs,
      total,
    };

    if (!hasFilters) {
      memoryCache.set(cacheKey, result, 5 * 60 * 1000);
    }

    return result;
  } catch (error) {
    console.error("Error getting songs:", error);
    throw error;
  }
};

export const invalidateSongsCache = () => {
  memoryCache.clear('songs');
};
