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

    // 1b. Tier Filters (Firestore-side range calculation)
    if (tierFilters && tierFilters.length > 0) {
      // Calculate the total range covered by selected tiers
      // S: 9+, A: 7.5-9, B: 6-7.5, C: 4-6, D: 0-4
      const tierMap: Record<string, { min: number, max: number }> = {
        S: { min: 9, max: 11 },
        A: { min: 7.5, max: 9 },
        B: { min: 6, max: 7.5 },
        C: { min: 4, max: 6 },
        D: { min: 0, max: 4 }
      };

      const mins = tierFilters.map(t => tierMap[t]?.min ?? 10);
      const maxs = tierFilters.map(t => tierMap[t]?.max ?? 0);
      
      const minVal = Math.min(...mins);
      const maxVal = Math.max(...maxs);

      if (minVal > 0) baseQuery = query(baseQuery, where("avgDifficulty", ">=", minVal));
      if (maxVal < 11) baseQuery = query(baseQuery, where("avgDifficulty", "<", maxVal));
    }

    // 1c. Genre Filters (Native Firestore array-contains-any)
    if (genreFilters && genreFilters.length > 0) {
      baseQuery = query(baseQuery, where("genres", "array-contains-any", genreFilters));
    }

    // 2. Search Path: Requires parallel queries and local merge
    if (searchQuery) {
      const s = searchQuery.toLowerCase();
      // Use the already filtered baseQuery to ensure filters apply to search results too
      const titleQ = query(baseQuery, where("title_lowercase", ">=", s), where("title_lowercase", "<=", s + "\uf8ff"), limit(100));
      const artistQ = query(baseQuery, where("artist_lowercase", ">=", s), where("artist_lowercase", "<=", s + "\uf8ff"), limit(100));

      const [titleSnap, artistSnap] = await Promise.all([
        trackedGetDocs(titleQ),
        trackedGetDocs(artistQ)
      ]);

      const titleResults = titleSnap.docs.map(d => ({ id: d.id, ...d.data() } as Song));
      const artistResults = artistSnap.docs.map(d => ({ id: d.id, ...d.data() } as Song));

      // Merge and Deduplicate
      const seenIds = new Set();
      let songs = [...titleResults, ...artistResults].filter(song => {
        if (seenIds.has(song.id)) return false;
        seenIds.add(song.id);
        return true;
      });

      // Sort merged results manually since they come from different queries
      songs.sort((a, b) => {
        const valA = (a as any)[sortBy] ?? (sortBy === 'title' ? '' : 0);
        const valB = (b as any)[sortBy] ?? (sortBy === 'title' ? '' : 0);
        if (typeof valA === 'string') {
          return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortDirection === "asc" ? valA - valB : valB - valA;
      });

      const total = songs.length;
      const startIndex = (page - 1) * itemsPerPage;
      const pagedSongs = songs.slice(startIndex, startIndex + itemsPerPage);

      const result = { songs: pagedSongs, total, lastDoc: null };
      memoryCache.set(cacheKey, result, 5 * 60 * 1000);
      return result;
    }

    // 3. Simple Path: Native Paging (Used for regular browsing AND Tier/Genre filtering)
    // This path is 100% native, no in-memory pooling
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
    const pagedSongs = (afterDoc && page > 1) ? docs : docs.slice((page - 1) * itemsPerPage);
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
