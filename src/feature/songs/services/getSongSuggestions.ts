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
    limit(MAX_SUGGESTIONS),
  );

  const snapshot = await trackedGetDocs(q);
  const suggestions = snapshot.docs.map((doc) => {
    const data = doc.data() as Song;
    return {
      id: doc.id,
      title: data.title,
      artist: data.artist,
      coverUrl: data.coverUrl,
      tier: data.tier,
    };
  });

  memoryCache.set(cacheKey, suggestions, 5 * 60 * 1000);
  return suggestions;
};
