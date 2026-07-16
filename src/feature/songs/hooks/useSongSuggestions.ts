import { useQuery } from "@tanstack/react-query";
import type { SongSuggestionField } from "feature/songs/services/getSongSuggestions";
import { getSongSuggestions } from "feature/songs/services/getSongSuggestions";
import { useEffect, useState } from "react";

// Keeps queries rare enough to not hammer Firestore while typing.
const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export const useSongSuggestions = (
  field: SongSuggestionField,
  rawQuery: string,
  enabled: boolean,
) => {
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const trimmed = rawQuery.trim();
    const timeout = setTimeout(
      () => setDebouncedQuery(trimmed),
      trimmed ? DEBOUNCE_MS : 0,
    );
    return () => clearTimeout(timeout);
  }, [rawQuery]);

  const isQueryReady = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const { data, isFetching } = useQuery({
    queryKey: ["song-suggestions", field, debouncedQuery.toLowerCase()],
    queryFn: () => getSongSuggestions(field, debouncedQuery),
    enabled: enabled && isQueryReady,
    staleTime: 5 * 60 * 1000,
  });

  return {
    suggestions: data ?? [],
    isLoading: enabled && isQueryReady && isFetching,
  };
};
