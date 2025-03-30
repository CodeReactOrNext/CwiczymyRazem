import type { SortByType } from "feature/leadboard/components/LeadboardLayout";
import { logger } from "feature/logger/Logger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { SeasonDataInterface } from "types/api.types";
import type { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";

import { getAvailableSeasons } from "../services/getAvailableSeasons";
import { getCurrentSeason } from "../services/getCurrentSeason";
import { getGlobalLeaderboard } from "../services/getGlobalLeaderboard";
import { getSeasonalLeaderboard } from "../services/getSeasonalLeaderboard";

interface UseLeaderboardProps {
  initialSortBy?: SortByType;
  itemsPerPage: number;
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
  handleViewChange: (isSeasonalView: boolean) => Promise<void>;
  handleSeasonChange: (seasonId: string) => Promise<void>;
}

export const useLeaderboard = ({
  initialSortBy = "points",
  itemsPerPage,
}: UseLeaderboardProps): UseLeaderboardReturn => {
  const { t } = useTranslation("leadboard");

  const [usersData, setUsersData] = useState<FirebaseUserDataInterface[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSeasonalView, setIsSeasonalView] = useState(false);
  const [seasons, setSeasons] = useState<SeasonDataInterface[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("");

  const loadGlobalLeaderboard = async (page: number) => {
    try {
      setIsLoading(true);
      const response = await getGlobalLeaderboard(
        initialSortBy,
        page,
        itemsPerPage
      );
      setUsersData(response.users);
      setTotalUsers(response.totalUsers);
    } catch (error) {
      logger.error(error, {
        context: "loadGlobalLeaderboard",
      });
      toast.error(t("fetch_error"));
    } finally {
      setIsLoading(false);
    }
  };

  const loadSeasonalLeaderboard = async (seasonId: string, page: number) => {
    try {
      setIsLoading(true);
      const response = await getSeasonalLeaderboard(
        seasonId,
        initialSortBy,
        page,
        itemsPerPage
      );

      if (response) {
        const mappedUsers = (response.users || []).map((user) => ({
          ...user,
          createdAt: new Date(),
          songLists: [],
        }));

        if (response.users && response.users.length > 0) {
          setUsersData(mappedUsers as any);
          setTotalUsers(response.totalUsers || 0);
        } else {
          setUsersData([]);
          setTotalUsers(0);
          toast(t("no_seasonal_data"));
        }
      }
    } catch {
      toast(t("fetch_error"));
      setUsersData([]);
      setTotalUsers(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (isSeasonalView && selectedSeason) {
      loadSeasonalLeaderboard(selectedSeason, page);
    } else {
      loadGlobalLeaderboard(page);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewChange = async (newIsSeasonalView: boolean) => {
    try {
      setIsLoading(true);
      setIsSeasonalView(newIsSeasonalView);
      setCurrentPage(1);

      if (newIsSeasonalView && selectedSeason) {
        await loadSeasonalLeaderboard(selectedSeason, 1);
      } else {
        await loadGlobalLeaderboard(1);
      }
    } catch {
      toast(t("view_change_error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeasonChange = async (newSeasonId: string) => {
    try {
      if (newSeasonId === selectedSeason) {
        return;
      }

      setIsLoading(true);
      setSelectedSeason(newSeasonId);
      setCurrentPage(1);
      await loadSeasonalLeaderboard(newSeasonId, 1);
    } catch {
      toast(t("season_change_error"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeSeasons = async () => {
      try {
        const [seasonsData, currentSeason] = await Promise.all([
          getAvailableSeasons(),
          getCurrentSeason(),
        ]);

        if (seasonsData.length > 0) {
          setSeasons(seasonsData);
          const activeSeason = currentSeason.seasonId;
          setSelectedSeason(activeSeason);

          if (isSeasonalView) {
            await loadSeasonalLeaderboard(activeSeason, 1);
          }
        }
      } catch {
        toast(t("seasons_fetch_error"));
      }
    };

    initializeSeasons();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    if (isSeasonalView && selectedSeason) {
      loadSeasonalLeaderboard(selectedSeason, 1);
    } else {
      loadGlobalLeaderboard(1);
    }
  }, []);

  return {
    usersData,
    isLoading,
    totalUsers,
    currentPage,
    isSeasonalView,
    seasons,
    selectedSeason,
    handlePageChange,
    handleViewChange,
    handleSeasonChange,
  };
};
