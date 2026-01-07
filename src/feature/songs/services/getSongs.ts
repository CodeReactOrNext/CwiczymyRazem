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
  titleQuery: string,
  artistQuery: string,
  page: number,
  itemsPerPage: number,
  tierFilters?: string[],
  difficultyFilter?: string,
  genreFilters?: string[],
  afterDoc?: any // Added for cursor support
) => {
  try {
    const hasSearch = titleQuery || artistQuery;

    // Cache key should include afterDoc id if present to distinguish cursors
    const cacheKey = JSON.stringify({
      sortBy,
      sortDirection,
      page,
      itemsPerPage,
      tierFilters,
      difficultyFilter,
      genreFilters,
      titleQuery,
      artistQuery,
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

    // 1b. Tier Filters (Direct Tier field filtering)
    if (tierFilters && tierFilters.length > 0) {
      baseQuery = query(baseQuery, where("tier", "in", tierFilters));
    }

    // 1c. Genre Filters (Native Firestore array-contains-any)
    if (genreFilters && genreFilters.length > 0) {
      baseQuery = query(baseQuery, where("genres", "array-contains-any", genreFilters));
    }

    // Fix for Count Mismatch: Ensure count respects "popularity" existence if sorting by it.
    // We can only do this if we don't have another range filter (difficultyFilter) to avoid Firestore "multiple range filters" error.
    if (sortBy === "popularity" && (!difficultyFilter || difficultyFilter === "all")) {
      baseQuery = query(baseQuery, where("popularity", ">=", 0));
    }

    // 2. Search Path: Requires parallel queries and local merge/intersection
    if (hasSearch) {
      const t = titleQuery.toLowerCase();
      const a = artistQuery.toLowerCase();

      let titleResults: Song[] = [];
      let artistResults: Song[] = [];

      const searches = [];
      if (t) {
        const titleQ = query(baseQuery, where("title_lowercase", ">=", t), where("title_lowercase", "<=", t + "\uf8ff"), limit(100));
        searches.push(trackedGetDocs(titleQ).then(snap => titleResults = snap.docs.map(d => ({ id: d.id, ...d.data() } as Song))));
      }
      if (a) {
        const artistQ = query(baseQuery, where("artist_lowercase", ">=", a), where("artist_lowercase", "<=", a + "\uf8ff"), limit(100));
        searches.push(trackedGetDocs(artistQ).then(snap => artistResults = snap.docs.map(d => ({ id: d.id, ...d.data() } as Song))));
      }

      await Promise.all(searches);

      let songs: Song[] = [];
      if (t && a) {
        // Intersection: must match both
        const artistIds = new Set(artistResults.map(s => s.id));
        songs = titleResults.filter(s => artistIds.has(s.id));
      } else {
        // Single search results
        songs = t ? titleResults : artistResults;
      }

      // Sort merged results manually since they come from different queries or manual intersection
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

    // Add secondary sort by ID (__name__) for stability
    let q = query(baseQuery, orderBy(sortBy, sortDirection), orderBy("__name__", "asc"));

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
