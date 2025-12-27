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

    // 2. Complex Path: Search or Tier/Genre filters
    if (searchQuery || (tierFilters && tierFilters.length > 0) || (genreFilters && genreFilters.length > 0)) {
      let songs: Song[] = [];

      if (searchQuery) {
        const s = searchQuery.toLowerCase();
        // 2a. NATIVE SEARCH: Run Title and Artist queries in parallel to get exact matching set from DB
        const titleQ = query(baseQuery, where("title_lowercase", ">=", s), where("title_lowercase", "<=", s + "\uf8ff"), limit(200));
        const artistQ = query(baseQuery, where("artist_lowercase", ">=", s), where("artist_lowercase", "<=", s + "\uf8ff"), limit(200));

        const [titleSnap, artistSnap] = await Promise.all([
          trackedGetDocs(titleQ),
          trackedGetDocs(artistQ)
        ]);

        const titleResults = titleSnap.docs.map(d => ({ id: d.id, ...d.data() } as Song));
        const artistResults = artistSnap.docs.map(d => ({ id: d.id, ...d.data() } as Song));

        // Deduplicate
        const seenIds = new Set();
        songs = [...titleResults, ...artistResults].filter(song => {
          if (seenIds.has(song.id)) return false;
          seenIds.add(song.id);
          return true;
        });
      } else {
        // 2b. If no search but has filters, we fetch a generous slice to filter locally
        // (Tier/Genre filtering is still best done in-memory due to Firestore range limits)
        const snapshot = await trackedGetDocs(query(baseQuery, orderBy(sortBy, sortDirection), limit(1000)));
        songs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Song));
      }

      // Local Post-Filtering (Tiers & Genres)
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

      // Handle re-sorting of merged search results
      if (searchQuery) {
        songs.sort((a, b) => {
          const valA = (a as any)[sortBy];
          const valB = (b as any)[sortBy];
          if (typeof valA === 'string') {
            return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
          }
          return sortDirection === "asc" ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
        });
      }

      const total = songs.length;
      const startIndex = (page - 1) * itemsPerPage;
      const pagedSongs = songs.slice(startIndex, startIndex + itemsPerPage);

      const result = { songs: pagedSongs, total, lastDoc: null };
      memoryCache.set(cacheKey, result, 5 * 60 * 1000);
      return result;
    }

    // 3. Simple Path: Direct Paging
    const countSnapshot = await getCountFromServer(baseQuery);
    const totalCountPool = countSnapshot.data().count;

    let q = query(baseQuery, orderBy(sortBy, sortDirection));
    if (afterDoc && page > 1) {
      q = query(q, startAfter(afterDoc), limit(itemsPerPage));
    } else {
      q = query(q, limit(page * itemsPerPage));
    }

    const snapshot = await trackedGetDocs(q);
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Song));
    const pagedSongs = afterDoc && page > 1 ? docs : docs.slice((page - 1) * itemsPerPage);
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];

    const result = {
      songs: pagedSongs,
      total: totalCountPool,
      lastDoc
    };

    memoryCache.set(cacheKey, result, 5 * 60 * 1000);
    return result;
  } catch (error) {
    console.error("Error getting songs:", error);
    throw error;
  }
};

export const invalidateSongsCache = () => {
  memoryCache.clear('songs');
};
