import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SortByType } from "feature/leadboard/components/LeadboardLayout";
import { useEffect, useMemo,useState } from "react";
import { useTranslation } from "react-i18next";
import type { SeasonDataInterface } from "types/api.types";
import type { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";

import { getAvailableSeasons } from "../services/getAvailableSeasons";
import { getCurrentSeason } from "../services/getCurrentSeason";
import { getGlobalLeaderboard } from "../services/getGlobalLeaderboard";
import { getSeasonalLeaderboard } from "../services/getSeasonalLeaderboard";

interface UseLeaderboardProps {
  initialSortBy?: SortByType;
  itemsPerPage: number;
  defaultView?: "all-time" | "seasonal";
}

interface UseLeaderboardReturn {
  usersData: FirebaseUserDataInterface[];
  isLoading: boolean;
  totalUsers: number;
  currentPage: number;
  isSeasonalView: boolean;
  seasons: SeasonDataInterface[];
  selectedSeason: string;
  handlePageChange: (page: number) => void;
  handleViewChange: (isSeasonalView: boolean) => void;
  handleSeasonChange: (seasonId: string) => void;
  lastAccessiblePage: number;
}

export const useLeaderboard = ({
  initialSortBy = "points",
  itemsPerPage,
  defaultView = "all-time",
}: UseLeaderboardProps): UseLeaderboardReturn => {
  const { t } = useTranslation("leadboard");
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  const [isSeasonalView, setIsSeasonalView] = useState(defaultView === "seasonal");
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
    queryKey: ["leaderboard", isSeasonalView ? "seasonal" : "global", selectedSeason, initialSortBy, currentPage],
    queryFn: async () => {
      const cursor = pageCursors[currentPage];
      if (isSeasonalView) {
        if (!selectedSeason) return null;
        return getSeasonalLeaderboard(selectedSeason, initialSortBy, itemsPerPage, cursor);
      }
      return getGlobalLeaderboard(initialSortBy, itemsPerPage, cursor);
    },
    enabled: !isSeasonalView || !!selectedSeason,
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
    if (isSeasonalView) {
      return leaderboardData.users.map((user: any) => ({
        ...user,
        createdAt: new Date(),
        songLists: [],
      }));
    }
    return leaderboardData.users;
  }, [leaderboardData, isSeasonalView]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewChange = (newIsSeasonalView: boolean) => {
    setIsSeasonalView(newIsSeasonalView);
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
    isSeasonalView,
    seasons,
    selectedSeason,
    handlePageChange,
    handleViewChange,
    handleSeasonChange,
    lastAccessiblePage: Math.max(...Object.keys(pageCursors).map(Number)),
  };
};
