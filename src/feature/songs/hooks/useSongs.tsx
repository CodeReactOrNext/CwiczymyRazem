import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSongs } from "feature/songs/services/getSongs";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import type { Song } from "feature/songs/types/songs.type";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useEffect,useRef, useState } from "react";
import { useAppSelector } from "store/hooks";

const ITEMS_PER_PAGE = 20;

export const useSongs = () => {
  const [titleQuery, setTitleQuery] = useState("");
  const [artistQuery, setArtistQuery] = useState("");
  const [debouncedTitle, setDebouncedTitle] = useState("");
  const [debouncedArtist, setDebouncedArtist] = useState("");
  const debounceTimeout = useRef<NodeJS.Timeout>(null);

  const [page, setPage] = useState(1);
  const [pageCursors, setPageCursors] = useState<Record<number, any>>({}); // Track cursors for each page
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [tierFilters, setTierFilters] = useState<string[]>([]);
  const [genreFilters, setGenreFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("popularity");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentUserId = useAppSelector(selectUserAuth);

  // Debounce search queries
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedTitle(titleQuery.trim());
      setDebouncedArtist(artistQuery.trim());
    }, 800);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [titleQuery, artistQuery]);

  // 1. Fetch Songs
  const { data: songsData, isLoading: isSongsLoading } = useQuery({
    queryKey: ["songs", sortBy, sortDirection, debouncedTitle, debouncedArtist, page, tierFilters, difficultyFilter, genreFilters],
    queryFn: () => getSongs(
      sortBy,
      sortDirection,
      debouncedTitle,
      debouncedArtist,
      page,
      ITEMS_PER_PAGE,
      tierFilters,
      difficultyFilter,
      genreFilters,
      pageCursors[page - 1] // Pass cursor of PREVIOUS page
    ),
    staleTime: 5 * 60 * 1000,
  });

  // Track cursor for the current page
  useEffect(() => {
    if (songsData?.lastDoc) {
      setPageCursors(prev => ({
        ...prev,
        [page]: songsData.lastDoc
      }));
    }
  }, [songsData?.lastDoc, page]);

  // Reset cursors and page when filters/sort change
  useEffect(() => {
    setPage(1);
    setPageCursors({});
  }, [sortBy, sortDirection, debouncedTitle, debouncedArtist, tierFilters, difficultyFilter, genreFilters]);

  // 2. Fetch User Songs
  const { data: userSongsData, refetch: refetchUserSongs } = useQuery({
    queryKey: ["user-songs", currentUserId],
    queryFn: () => getUserSongs(currentUserId!),
    enabled: !!currentUserId,
    staleTime: 10 * 60 * 1000,
  });

  const songs = songsData?.songs || [];
  const totalPages = Math.ceil((songsData?.total || 0) / ITEMS_PER_PAGE);
  const userSongs = userSongsData || { wantToLearn: [], learning: [], learned: [] };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleClearFilters = () => {
    setDifficultyFilter("all");
    setTierFilters([]);
    setGenreFilters([]);
    setSortBy("popularity");
    setSortDirection("desc");
    setTitleQuery("");
    setArtistQuery("");
  };

  const hasFilters =
    difficultyFilter !== "all" ||
    tierFilters.length > 0 ||
    genreFilters.length > 0 ||
    titleQuery.trim() !== "" ||
    artistQuery.trim() !== "";

  const getSongStatus = (songId: string) => {
    if (userSongs.wantToLearn.some((song) => song.id === songId)) return "wantToLearn";
    if (userSongs.learning.some((song) => song.id === songId)) return "learning";
    if (userSongs.learned.some((song) => song.id === songId)) return "learned";
    return null;
  };

  const queryClient = useQueryClient();

  const updateUserSongsCache = (newSongs: { wantToLearn: Song[]; learning: Song[]; learned: Song[] }) => {
     queryClient.setQueryData(["user-songs", currentUserId], newSongs);
  };

  return {
    updateUserSongsCache,
    page,
    userSongs,
    isLoading: isSongsLoading,
    hasMore: !!songsData?.hasMore,
    hasFilters,
    titleQuery,
    setTitleQuery,
    artistQuery,
    setArtistQuery,
    isModalOpen,
    filteredSongs: songs,
    setIsModalOpen,
    debounceLoading: isSongsLoading,
    difficultyFilter,
    handlePageChange,
    handleClearFilters,
    setDifficultyFilter,
    tierFilters,
    setTierFilters,
    genreFilters,
    setGenreFilters,
    handleStatusUpdate: () => refetchUserSongs(),
    getSongStatus,
    refreshSongs: () => refetchUserSongs(),
    refreshSongsWithoutLoading: () => refetchUserSongs(),
    applyFilters: (newFilters: {
      difficultyFilter?: string;
      tierFilters?: string[];
      genreFilters?: string[];
      sortBy?: string;
      sortDirection?: "asc" | "desc";
    }) => {
      if (newFilters.difficultyFilter !== undefined) setDifficultyFilter(newFilters.difficultyFilter);
      if (newFilters.tierFilters !== undefined) setTierFilters(newFilters.tierFilters);
      if (newFilters.genreFilters !== undefined) setGenreFilters(newFilters.genreFilters);
      if (newFilters.sortBy !== undefined) setSortBy(newFilters.sortBy);
      if (newFilters.sortDirection !== undefined) setSortDirection(newFilters.sortDirection);
      setPage(1);
    },
    handleResetFilters: () => {
      handleClearFilters();
      setPage(1);
    },
    songs,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
  };
};
