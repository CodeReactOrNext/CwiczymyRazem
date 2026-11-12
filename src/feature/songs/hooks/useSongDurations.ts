import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  fetchSongDurations,
  type SongDurations,
} from "../services/songDurations.service";

const NO_DURATIONS: SongDurations = {};

/**
 * Recording lengths of the given songs. A song's length never changes, so the
 * answer is kept for the whole visit; songs still unknown (or not looked up
 * yet) are simply missing from the map.
 */
export const useSongDurations = (songIds: readonly string[]) => {
  const ids = useMemo(() => Array.from(new Set(songIds)).sort(), [songIds]);

  const { data } = useQuery({
    queryKey: ["songDurations", ids],
    queryFn: () => fetchSongDurations(ids),
    enabled: ids.length > 0,
    staleTime: Infinity,
    retry: false,
  });

  return data ?? NO_DURATIONS;
};
