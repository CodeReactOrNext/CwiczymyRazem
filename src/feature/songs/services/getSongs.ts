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

    // 2. Search Path: Optimized for Native Pagination
    if (hasSearch) {
      const t = titleQuery.toLowerCase();
      const a = artistQuery.toLowerCase();

      // Determine which field to use for the native query
      // If both are present, we use artist as primary and title as local filter for simplicity
      // but still use native paging on the artist query
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
      let docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Song));

      // If searching for both, apply the second filter locally
      if (t && a) {
        docs = docs.filter(s => s.title_lowercase?.includes(t));
      }

      // Note: total count with filters is hard in Firestore without fetching all.
      // We use a safe estimate or the count from the current snapshot size for now,
      // but for better UX we can keep the totalCount from the baseQuery (though it won't be 100% accurate for search)
      const result = {
        songs: docs,
        total: (page * itemsPerPage) + (docs.length === itemsPerPage ? 100 : 0), // Fake total to keep pagination alive
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
