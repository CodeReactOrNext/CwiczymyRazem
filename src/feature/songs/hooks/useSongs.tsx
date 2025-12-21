import { getSongs } from "feature/songs/services/getSongs";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import type { Song } from "feature/songs/types/songs.type";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "store/hooks";

const ITEMS_PER_PAGE = 50;

export const useSongs = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [userSongs, setUserSongs] = useState<{
    wantToLearn: Song[];
    learning: Song[];
    learned: Song[];
  }>({
    wantToLearn: [],
    learning: [],
    learned: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [debounceLoading, setIsDebounceLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const debounceTimeout = useRef<NodeJS.Timeout>(null);

  const [page, setPage] = useState(1);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [tierFilters, setTierFilters] = useState<string[]>([]);
  const [genreFilters, setGenreFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const currentUserId = useAppSelector(selectUserAuth);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 800);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchQuery]);

  const getStatus = (userSongs: any, songId: string) => {
    if (!userSongs) return null;

    if (userSongs.wantToLearn?.includes(songId)) return "wantToLearn";
    if (userSongs.learning?.includes(songId)) return "learning";
    if (userSongs.learned?.includes(songId)) return "learned";
    return null;
  };

  const getAverageDifficulty = (difficulties: { rating: number }[]) => {
    if (!difficulties?.length) return 0;
    return (
      difficulties.reduce((acc, curr) => acc + curr.rating, 0) /
      difficulties.length
    );
  };

  const loadSongs = async (skipLoading = false) => {
    try {
      if (!skipLoading) {
        setIsLoading(true);
      }
      const loadedSongs = await getSongs(
        sortBy,
        sortDirection,
        debouncedSearchQuery,
        page,
        ITEMS_PER_PAGE,
        tierFilters,
        difficultyFilter,
        genreFilters
      );
      setSongs(loadedSongs.songs);
      setTotalPages(Math.ceil(loadedSongs.total / ITEMS_PER_PAGE));
    } catch (error) {
      console.error("Error loading songs:", error);
    } finally {
      setIsDebounceLoading(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsDebounceLoading(true);
    loadSongs(true);
  }, [debouncedSearchQuery, page, tierFilters, difficultyFilter, genreFilters, sortBy, sortDirection]);

  const loadUserSongs = async () => {
    if (currentUserId) {
      const songs = await getUserSongs(currentUserId);
      setUserSongs(songs);
    }
  };

  useEffect(() => {
    loadUserSongs();
  }, [currentUserId]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleClearFilters = () => {
    setDifficultyFilter("all");
    setTierFilters([]);
    setGenreFilters([]);
    setSortBy("title");
    setSortDirection("asc");
  };

  const filteredSongs = songs; // Filtering logic moved completely to getSongs for consistency

  const hasFilters =
    difficultyFilter !== "all" ||
    tierFilters.length > 0 ||
    genreFilters.length > 0 ||
    searchQuery !== "";

  const refreshSongs = async () => {
    if (!currentUserId) return;
    const songs = await getUserSongs(currentUserId);
    setUserSongs(songs);
    await loadSongs();
  };

  const refreshSongsWithoutLoading = async () => {
    if (!currentUserId) return;
    const songs = await getUserSongs(currentUserId);
    setUserSongs(songs);
    await loadSongs(true);
  };

  const handleStatusUpdate = async () => {
    await refreshSongs();
  };

  const getSongStatus = (songId: string) => {
    if (userSongs.wantToLearn.some((song) => song.id === songId))
      return "wantToLearn";
    if (userSongs.learning.some((song) => song.id === songId))
      return "learning";
    if (userSongs.learned.some((song) => song.id === songId)) return "learned";
    return null;
  };

  return {
    page,
    userSongs,
    setUserSongs,
    isLoading,
    loadSongs,
    totalPages,
    hasFilters,
    searchQuery,
    isModalOpen,
    filteredSongs,
    setSearchQuery,
    setIsModalOpen,
    debounceLoading,
    difficultyFilter,
    handlePageChange,
    handleClearFilters,
    setDifficultyFilter,
    tierFilters,
    setTierFilters,
    genreFilters,
    setGenreFilters,
    loadUserSongs,
    handleStatusUpdate,
    getSongStatus,
    refreshSongs,
    refreshSongsWithoutLoading,
    songs,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
  };
};
