import { useQuery } from "@tanstack/react-query";
import type { SortByType } from "feature/leadboard/components/LeadboardLayout";
import { useEffect, useMemo,useState } from "react";
import type { SeasonDataInterface } from "types/api.types";
import type { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";

import { getAvailableSeasons } from "../services/getAvailableSeasons";
import { getCurrentSeason } from "../services/getCurrentSeason";
import { getGearLeaderboard } from "../services/getGearLeaderboard";
import { getGlobalLeaderboard } from "../services/getGlobalLeaderboard";
import { getSeasonalLeaderboard } from "../services/getSeasonalLeaderboard";

export type LeaderboardViewType = "all-time" | "seasonal" | "gear";

interface UseLeaderboardProps {
  initialSortBy?: SortByType;
  itemsPerPage: number;
  defaultView?: LeaderboardViewType;
}

interface UseLeaderboardReturn {
  usersData: FirebaseUserDataInterface[];
  isLoading: boolean;
  totalUsers: number;
  currentPage: number;
  view: LeaderboardViewType;
  seasons: SeasonDataInterface[];
  selectedSeason: string;
  handlePageChange: (page: number) => void;
  handleViewChange: (view: LeaderboardViewType) => void;
  handleSeasonChange: (seasonId: string) => void;
  lastAccessiblePage: number;
}

export const useLeaderboard = ({
  initialSortBy = "points",
  itemsPerPage,
  defaultView = "all-time",
}: UseLeaderboardProps): UseLeaderboardReturn => {
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setView] = useState<LeaderboardViewType>(defaultView);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [pageCursors, setPageCursors] = useState<{ [key: number]: any }>({ 1: null });

  // 1. Fetch Seasons
  const { data: seasonsData = { seasons: [], currentSeasonId: "" } } = useQuery({
    queryKey: ["leaderboard", "seasons"],
    queryFn: async () => {
      const [seasons, current] = await Promise.all([
        getAvailableSeasons(),
        getCurrentSeason(),
      ]);
      return { seasons, currentSeasonId: current.seasonId };
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  const seasons = seasonsData.seasons;

  useEffect(() => {
    if (seasonsData.currentSeasonId && !selectedSeason) {
      setSelectedSeason(seasonsData.currentSeasonId);
    }
  }, [seasonsData.currentSeasonId]);

  // 2. Fetch Leaderboard Data
  const { data: leaderboardData, isLoading: isLeaderboardLoading } = useQuery({
    queryKey: ["leaderboard", view, selectedSeason, initialSortBy, currentPage],
    queryFn: async () => {
      const cursor = pageCursors[currentPage];
      if (view === "seasonal") {
        if (!selectedSeason) return null;
        return getSeasonalLeaderboard(selectedSeason, initialSortBy, itemsPerPage, cursor);
      }
      if (view === "gear") {
        return getGearLeaderboard(itemsPerPage, cursor);
      }
      return getGlobalLeaderboard(initialSortBy, itemsPerPage, cursor);
    },
    enabled: view !== "seasonal" || !!selectedSeason,
  });

  // Track next page cursor
  useEffect(() => {
    if (leaderboardData?.lastVisible) {
      setPageCursors(prev => ({
        ...prev,
        [currentPage + 1]: leaderboardData.lastVisible
      }));
    }
  }, [leaderboardData, currentPage]);

  const usersData = useMemo(() => {
    if (!leaderboardData?.users) return [];
    if (view === "seasonal") {
      return leaderboardData.users.map((user: any) => ({
        ...user,
        createdAt: new Date(),
        songLists: [],
      }));
    }
    return leaderboardData.users;
  }, [leaderboardData, view]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewChange = (newView: LeaderboardViewType) => {
    setView(newView);
    setCurrentPage(1);
    setPageCursors({ 1: null });
  };

  const handleSeasonChange = (newSeasonId: string) => {
    if (newSeasonId !== selectedSeason) {
      setSelectedSeason(newSeasonId);
      setCurrentPage(1);
      setPageCursors({ 1: null });
    }
  };

  return {
    usersData,
    isLoading: isLeaderboardLoading,
    totalUsers: leaderboardData?.totalUsers || 0,
    currentPage,
    view,
    seasons,
    selectedSeason,
    handlePageChange,
    handleViewChange,
    handleSeasonChange,
    lastAccessiblePage: Math.max(...Object.keys(pageCursors).map(Number)),
  };
};
