import type { Song } from "feature/songs/types/songs.type";
import {
  collection,
  getCountFromServer,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { memoryCache } from "utils/cache/memoryCache";
import { db } from "utils/firebase/client/firebase.utils";
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

    const hasOtherFilters =
      (difficultyFilter && difficultyFilter !== "all") ||
      (tierFilters && tierFilters.length > 0) ||
      (genreFilters && genreFilters.length > 0);

    // Override sort to 'title' (asc) if filtering by properties while sorting by popularity,
    // to avoid needing composite indexes for every combination of filters + popularity.
    let effectiveSortBy = sortBy;
    let effectiveSortDirection = sortDirection;

    if (sortBy === "popularity" && hasOtherFilters) {
      effectiveSortBy = "title";
      effectiveSortDirection = "asc";
    }

    // Cache key should include afterDoc id if present to distinguish cursors
    const cacheKey = JSON.stringify({
      sortBy: effectiveSortBy,
      sortDirection: effectiveSortDirection,
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

    // 1b. Tier Filters (Direct Tier field filtering)
    if (tierFilters && tierFilters.length > 0) {
      baseQuery = query(baseQuery, where("tier", "in", tierFilters));
    }

    // 1c. Genre Filters (Native Firestore array-contains-any)
    // Only apply if tier filter is NOT present, to avoid Multiple Disjunctions error
    if (genreFilters && genreFilters.length > 0 && !(tierFilters && tierFilters.length > 0)) {
      baseQuery = query(baseQuery, where("genres", "array-contains-any", genreFilters));
    }

    // Fix for Count Mismatch: Ensure count respects "popularity" existence if sorting by it.
    // We only apply this if NOT searching to avoid inequality conflicts.
    if (!hasSearch && effectiveSortBy === "popularity") {
      baseQuery = query(baseQuery, where("popularity", ">=", 0));
    }

    // 2. Search Path: Optimized for Correctness and Selectivity
    if (hasSearch) {
      const t = titleQuery.toLowerCase();
      const a = artistQuery.toLowerCase();

      // If both are present, search by TITLE in DB (more selective) and filter artist locally.
      // We fetch a larger pool (200) to ensure we don't miss the artist/title combo.
      if (t && a) {
        let q = query(
          baseQuery,
          where("title_lowercase", ">=", t),
          where("title_lowercase", "<=", t + "\uf8ff"),
          orderBy("title_lowercase", "asc"),
          limit(200)
        );

        const snapshot = await trackedGetDocs(q);
        let docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Song));

        // Local intersection
        const filtered = docs.filter(s => s.artist_lowercase?.includes(a));

        // Local pagination for the intersection results
        const startIndex = (page - 1) * itemsPerPage;
        const pagedDocs = filtered.slice(startIndex, startIndex + itemsPerPage);

        const result = {
          songs: pagedDocs,
          hasMore: filtered.length > startIndex + itemsPerPage,
          lastDoc: null
        };
        memoryCache.set(cacheKey, result, 5 * 60 * 1000);
        return result;
      }

      // Single field search: 100% Native with cursors
      const searchField = a ? "artist_lowercase" : "title_lowercase";
      const searchValue = a || t;

      let q = query(
        baseQuery,
        where(searchField, ">=", searchValue),
        where(searchField, "<=", searchValue + "\uf8ff"),
        orderBy(searchField, "asc"),
        orderBy("__name__", "asc"),
        limit(itemsPerPage)
      );

      if (afterDoc) {
        q = query(q, startAfter(afterDoc));
      }

      const snapshot = await trackedGetDocs(q);
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Song));

      const result = {
        songs: docs,
        hasMore: docs.length === itemsPerPage,
        lastDoc: snapshot.docs[snapshot.docs.length - 1]
      };
      memoryCache.set(cacheKey, result, 5 * 60 * 1000);
      return result;
    }

    // 3. Simple Path: Native Paging (Used for regular browsing AND Tier/Genre filtering)
    // This path is 100% native, uses cursors and strictly respects itemsPerPage
    const countSnapshot = await getCountFromServer(baseQuery);
    const totalCountPool = countSnapshot.data().count;

    // Add secondary sort by ID (__name__) for stability
    let q = query(baseQuery, orderBy(effectiveSortBy, effectiveSortDirection), orderBy("__name__", "asc"));

    // Optimized: Always use the limit dictated by the interface
    q = query(q, limit(itemsPerPage));

    if (afterDoc) {
      q = query(q, startAfter(afterDoc));
    }

    const snapshot = await trackedGetDocs(q);
    let docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Song));

    // Local filtering for skipped Genre disjunction (if Tier filter was also active) in simple path
    if (genreFilters && genreFilters.length > 0 && (tierFilters && tierFilters.length > 0)) {
      docs = docs.filter(s => s.genres && genreFilters.some(g => s.genres?.includes(g)));
    }

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];

    const result = {
      songs: docs,
      total: totalCountPool,
      hasMore: docs.length === itemsPerPage,
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
