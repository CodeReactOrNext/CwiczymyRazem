import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPopularRecordingPool,
  getRecordings,
  hydrateRecordingAuthors,
} from "feature/recordings/services/getRecordings";
import { useEffect, useState } from "react";

const ITEMS_PER_PAGE = 12;
const STALE_TIME = 5 * 60 * 1000;

export type RecordingsSort = "newest" | "popular";

export const useRecordings = (
  filterByUserId?: string,
  filterBySongId?: string,
  sort: RecordingsSort = "newest",
) => {
  const [page, setPage] = useState(1);
  const [pageCursors, setPageCursors] = useState<Record<number, any>>({});

  // The filters are owned by the caller, not by this hook: SongDetailView swaps the
  // song under a still-mounted recordings section, and copying the arguments into
  // state once would keep serving the previously opened song's recordings.
  // Resetting during render (instead of in an effect) means the query below already
  // runs with page 1 for the new filter, without a throwaway fetch of the old page.
  // The sort is part of the key too: page 3 of "newest" means nothing in "popular",
  // and the newest-order cursors cannot be reused there.
  const filterKey = `${filterByUserId ?? ""}|${filterBySongId ?? ""}|${sort}`;
  const [appliedFilterKey, setAppliedFilterKey] = useState(filterKey);
  if (appliedFilterKey !== filterKey) {
    setAppliedFilterKey(filterKey);
    setPage(1);
    setPageCursors({});
  }

  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey:
      sort === "popular"
        ? ["recordings", "popular", page, filterByUserId, filterBySongId]
        : ["recordings", page, filterByUserId, filterBySongId],
    queryFn: async () => {
      if (sort === "popular") {
        // One read of the pool serves every page; only the visible page's
        // authors are hydrated. Shares the "recordings" prefix, so likes and
        // comments invalidate it along with everything else.
        const pool = await queryClient.fetchQuery({
          queryKey: ["recordings", "popular-pool", filterByUserId, filterBySongId],
          queryFn: () => getPopularRecordingPool(filterByUserId, filterBySongId),
          staleTime: STALE_TIME,
        });
        const start = (page - 1) * ITEMS_PER_PAGE;
        return {
          recordings: await hydrateRecordingAuthors(
            pool.slice(start, start + ITEMS_PER_PAGE),
          ),
          total: pool.length,
          lastDoc: null,
        };
      }
      return getRecordings(
        page,
        ITEMS_PER_PAGE,
        filterByUserId,
        filterBySongId,
        pageCursors[page - 1]
      );
    },
    staleTime: STALE_TIME,
  });

  // Track cursor for current page
  useEffect(() => {
    if (data?.lastDoc) {
      setPageCursors(prev => ({
        ...prev,
        [page]: data.lastDoc
      }));
    }
  }, [data?.lastDoc, page]);

  const totalPages = Math.ceil((data?.total || 0) / ITEMS_PER_PAGE);

  return {
    recordings: data?.recordings || [],
    total: data?.total || 0,
    isLoading,
    page,
    setPage,
    totalPages,
    refreshRecordings: refetch,
    filterByUserId,
    filterBySongId,
  };
};
