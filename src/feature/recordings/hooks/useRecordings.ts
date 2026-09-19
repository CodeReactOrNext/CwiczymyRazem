import { useQuery } from "@tanstack/react-query";
import { getRecordings } from "feature/recordings/services/getRecordings";
import { useEffect, useState } from "react";

const ITEMS_PER_PAGE = 12;

export const useRecordings = (filterByUserId?: string, filterBySongId?: string) => {
  const [page, setPage] = useState(1);
  const [pageCursors, setPageCursors] = useState<Record<number, any>>({});

  // The filters are owned by the caller, not by this hook: SongDetailView swaps the
  // song under a still-mounted recordings section, and copying the arguments into
  // state once would keep serving the previously opened song's recordings.
  // Resetting during render (instead of in an effect) means the query below already
  // runs with page 1 for the new filter, without a throwaway fetch of the old page.
  const filterKey = `${filterByUserId ?? ""}|${filterBySongId ?? ""}`;
  const [appliedFilterKey, setAppliedFilterKey] = useState(filterKey);
  if (appliedFilterKey !== filterKey) {
    setAppliedFilterKey(filterKey);
    setPage(1);
    setPageCursors({});
  }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["recordings", page, filterByUserId, filterBySongId],
    queryFn: () => getRecordings(
      page,
      ITEMS_PER_PAGE,
      filterByUserId,
      filterBySongId,
      pageCursors[page - 1]
    ),
    staleTime: 5 * 60 * 1000,
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
