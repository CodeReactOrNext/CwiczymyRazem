import type { Song } from "feature/songs/types/songs.type";
import { collection, limit, orderBy, query, where } from "firebase/firestore";
import { memoryCache } from "utils/cache/memoryCache";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDocs } from "utils/firebase/client/firestoreTracking";

export type SongSuggestionField = "title" | "artist";

export type SongSuggestion = Pick<
  Song,
  "id" | "title" | "artist" | "coverUrl" | "tier"
>;

const MAX_SUGGESTIONS = 6;
// When searching by artist, many docs can share the same artist — fetch a
// wider window so deduping still leaves us with MAX_SUGGESTIONS distinct
// artists instead of collapsing down to just one or two.
const ARTIST_SCAN_LIMIT = 30;

// Keeps only the first song per distinct artist (results are already
// ordered by artist_lowercase, so same-artist docs are contiguous).
const dedupeByArtist = (suggestions: SongSuggestion[]): SongSuggestion[] => {
  const seen = new Set<string>();
  const deduped: SongSuggestion[] = [];

  for (const suggestion of suggestions) {
    const key = suggestion.artist.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(suggestion);
    if (deduped.length >= MAX_SUGGESTIONS) break;
  }

  return deduped;
};

export const getSongSuggestions = async (
  field: SongSuggestionField,
  rawValue: string,
): Promise<SongSuggestion[]> => {
  const value = rawValue.trim().toLowerCase();
  if (!value) return [];

  const fieldName = field === "title" ? "title_lowercase" : "artist_lowercase";
  const cacheKey = `song-suggestions:${fieldName}:${value}`;

  const cached = memoryCache.get(cacheKey);
  if (cached) return cached as SongSuggestion[];

  const q = query(
    collection(db, "songs"),
    where(fieldName, ">=", value),
    where(fieldName, "<=", value + ""),
    orderBy(fieldName, "asc"),
    limit(field === "artist" ? ARTIST_SCAN_LIMIT : MAX_SUGGESTIONS),
  );

  const snapshot = await trackedGetDocs(q);
  const mapped = snapshot.docs.map((doc) => {
    const data = doc.data() as Song;
    return {
      id: doc.id,
      title: data.title,
      artist: data.artist,
      coverUrl: data.coverUrl,
      tier: data.tier,
    };
  });

  const suggestions =
    field === "artist" ? dedupeByArtist(mapped) : mapped.slice(0, MAX_SUGGESTIONS);

  memoryCache.set(cacheKey, suggestions, 5 * 60 * 1000);
  return suggestions;
};
