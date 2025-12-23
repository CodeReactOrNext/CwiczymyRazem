import type { Song } from "feature/songs/types/songs.type";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getCountFromServer,
  startAfter,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { memoryCache } from "utils/cache/memoryCache";
import { trackedGetDocs } from "utils/firebase/client/firestoreTracking";

export const getSongs = async (
  sortBy: string,
  sortDirection: "asc" | "desc",
  searchQuery: string,
  page: number,
  itemsPerPage: number,
  tierFilters?: string[],
  difficultyFilter?: string,
  genreFilters?: string[],
  afterDoc?: any // Added for cursor support
) => {
  try {
    const hasComplexFilters = (tierFilters && tierFilters.length > 0) || (genreFilters && genreFilters.length > 0) || searchQuery;

    // Cache key should include afterDoc id if present to distinguish cursors
    const cacheKey = JSON.stringify({
      sortBy,
      sortDirection,
      page,
      itemsPerPage,
      tierFilters,
      difficultyFilter,
      genreFilters,
      searchQuery,
      afterDocId: afterDoc?.id
    });

    const cached = memoryCache.get(cacheKey);
    if (cached) return cached;

    const songsRef = collection(db, "songs");
    let baseQuery = query(songsRef);

    // 1. Difficulty Filter (Firestore-side)
    if (difficultyFilter && difficultyFilter !== "all") {
      if (difficultyFilter === "easy") baseQuery = query(baseQuery, where("avgDifficulty", "<=", 4));
      else if (difficultyFilter === "medium") baseQuery = query(baseQuery, where("avgDifficulty", ">", 4), where("avgDifficulty", "<=", 7));
      else if (difficultyFilter === "hard") baseQuery = query(baseQuery, where("avgDifficulty", ">", 7));
    }

    // 2. Get Total Count (Very Cheap)
    // For simple queries, getCountFromServer is 100x cheaper than fetching docs.
    const countSnapshot = await getCountFromServer(baseQuery);
    const totalCountPool = countSnapshot.data().count;

    // 3. Sorting and Paging
    let q = query(baseQuery, orderBy(sortBy, sortDirection));

    if (!hasComplexFilters) {
      // Database Paging: Efficient cursor-based skip
      if (afterDoc && page > 1) {
        q = query(q, startAfter(afterDoc), limit(itemsPerPage));
      } else {
        // Fallback for jumps or first page
        const limitCount = page * itemsPerPage;
        q = query(q, limit(limitCount));
      }

      const snapshot = await trackedGetDocs(q);
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Song));

      // If we used startAfter, we have exactly itemsPerPage or less.
      // If we used limitCount (jumps), we still need to slice.
      const pagedSongs = afterDoc && page > 1 ? docs : docs.slice((page - 1) * itemsPerPage);
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];

      const result = {
        songs: pagedSongs,
        total: totalCountPool,
        lastDoc // Return for next page cursor
      };

      memoryCache.set(cacheKey, result, 5 * 60 * 1000);
      return result;
    } else {
      // Complex path: Fetch pool and filter in-memory (still limited to 500 to prevent cost spikes)
      const snapshot = await trackedGetDocs(query(q, limit(500)));
      let songs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Song));

      if (tierFilters && tierFilters.length > 0) {
        songs = songs.filter(song => {
          const diff = song.avgDifficulty ?? 0;
          if (tierFilters.includes("S") && diff >= 9) return true;
          if (tierFilters.includes("A") && diff >= 7.5 && diff < 9) return true;
          if (tierFilters.includes("B") && diff >= 6 && diff < 7.5) return true;
          if (tierFilters.includes("C") && diff >= 4 && diff < 6) return true;
          if (tierFilters.includes("D") && diff < 4) return true;
          return false;
        });
      }

      if (genreFilters && genreFilters.length > 0) {
        songs = songs.filter(song => song.genres?.some(g => genreFilters.includes(g)));
      }

      if (searchQuery) {
        const s = searchQuery.toLowerCase();
        songs = songs.filter(song =>
          song.title?.toLowerCase().includes(s) ||
          song.artist?.toLowerCase().includes(s)
        );
      }

      const total = songs.length;
      const startIndex = (page - 1) * itemsPerPage;
      const pagedSongs = songs.slice(startIndex, startIndex + itemsPerPage);

      const result = { songs: pagedSongs, total, lastDoc: null };
      memoryCache.set(cacheKey, result, 5 * 60 * 1000);
      return result;
    }
  } catch (error) {
    console.error("Error getting songs:", error);
    throw error;
  }
};

export const invalidateSongsCache = () => {
  memoryCache.clear('songs');
};
