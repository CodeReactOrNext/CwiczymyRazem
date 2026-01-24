import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRecordings } from "feature/recordings/services/getRecordings";
import { useEffect, useState } from "react";

const ITEMS_PER_PAGE = 12;

export const useRecordings = (initialFilterByUserId?: string, initialFilterBySongId?: string) => {
  const [page, setPage] = useState(1);
  const [pageCursors, setPageCursors] = useState<Record<number, any>>({});
  const [filterByUserId, setFilterByUserId] = useState(initialFilterByUserId);
  const [filterBySongId, setFilterBySongId] = useState(initialFilterBySongId);

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

  // Reset pagination on filter change
  useEffect(() => {
    setPage(1);
    setPageCursors({});
  }, [filterByUserId, filterBySongId]);

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
    setFilterByUserId,
    filterBySongId,
    setFilterBySongId,
  };
};
