import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Song } from "utils/firebase/client/firebase.types";
import { getSongs, getUserSongs } from "utils/firebase/client/firebase.utils";
import { useAppSelector } from "store/hooks";
import { selectUserAuth } from "feature/user/store/userSlice";

const ITEMS_PER_PAGE = 20;

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const debounceTimeout = useRef<NodeJS.Timeout>();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const currentUserId = useAppSelector(selectUserAuth);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

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
        "title",
        "desc",
        debouncedSearchQuery,
        page,
        ITEMS_PER_PAGE
      );
      setSongs(loadedSongs.songs);
      setTotalPages(Math.ceil(loadedSongs.total / ITEMS_PER_PAGE));
    } catch (error) {
      console.error("Error loading songs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSongs();
  }, [debouncedSearchQuery, page]);

  const loadUserSongs = async () => {
    if (currentUserId) {
      const songs = await getUserSongs(currentUserId);
      setUserSongs(songs);
    }
  };

  useEffect(() => {
    loadUserSongs();
  }, [currentUserId, statusFilter]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleClearFilters = () => {
    setStatusFilter("all");
    setDifficultyFilter("all");
  };

  const filteredSongs = songs.filter((song) => {
    let matchesStatus = true;
    let matchesDifficulty = true;

    if (statusFilter !== "all") {
      const songStatus = getStatus(userSongs, song.id);
      matchesStatus = songStatus === statusFilter;
    }

    if (difficultyFilter !== "all") {
      const avgDifficulty = getAverageDifficulty(song.difficulties);
      switch (difficultyFilter) {
        case "easy":
          matchesDifficulty = avgDifficulty <= 4;
          break;
        case "medium":
          matchesDifficulty = avgDifficulty > 4 && avgDifficulty <= 7;
          break;
        case "hard":
          matchesDifficulty = avgDifficulty > 7;
          break;
      }
    }

    return matchesStatus && matchesDifficulty;
  });

  const hasFilters =
    statusFilter !== "all" || difficultyFilter !== "all" || searchQuery !== "";

  const refreshSongs = async () => {
    if (!currentUserId) return;
    const songs = await getUserSongs(currentUserId);
    setUserSongs(songs);
    await loadSongs();
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
    statusFilter,
    filteredSongs,
    setSearchQuery,
    setIsModalOpen,
    setStatusFilter,
    difficultyFilter,
    handlePageChange,
    handleClearFilters,
    setDifficultyFilter,
    loadUserSongs,
    handleStatusUpdate,
    getSongStatus,
    refreshSongs,
  };
};
