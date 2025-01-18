import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAppSelector } from "store/hooks";
import { useTranslation } from "react-i18next";

import PageLoadingLayout from "layouts/PageLoadingLayout";
import LeadboardLayout from "../../LeadboardLayout";

import { selectUserAuth } from "feature/user/store/userSlice";
import { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";
import {
  firebaseGetUsersExceriseRaport,
  getTotalUsersCount,
  getSeasonalLeaderboard,
  getCurrentSeason,
  getAvailableSeasons,
} from "utils/firebase/client/firebase.utils";
import { SortByType } from "../../types";
import { SeasonDataInterface } from "types/api.types";

const ITEMS_PER_PAGE = 30;

const LeadboardView = () => {
  const { t } = useTranslation("leadboard");
  const currentUserId = useAppSelector(selectUserAuth);

  const [usersData, setUsersData] = useState<FirebaseUserDataInterface[]>([]);
  const [sortBy, setSortBy] = useState<SortByType>("points");
  const [isLoading, setIsLoading] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSeasonalView, setIsSeasonalView] = useState(false);
  const [seasons, setSeasons] = useState<SeasonDataInterface[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("");

  const loadGlobalLeaderboard = async (page: number) => {
    try {
      setIsLoading(true);
      const [usersResponse, totalCount] = await Promise.all([
        firebaseGetUsersExceriseRaport(sortBy, page, ITEMS_PER_PAGE),
        getTotalUsersCount(),
      ]);
      setUsersData(usersResponse.users);
      setTotalUsers(totalCount);
    } catch (error) {
      console.error("Error loading global leaderboard:", error);
      toast(t("fetch_error"));
    } finally {
      setIsLoading(false);
    }
  };

  const loadSeasonalLeaderboard = async (seasonId: string, page: number) => {
    console.log("🔵 Starting loadSeasonalLeaderboard:", {
      seasonId,
      page,
      sortBy,
    });
    try {
      setIsLoading(true);
      const response = await getSeasonalLeaderboard(
        seasonId,
        sortBy,
        page,
        ITEMS_PER_PAGE
      );
      console.log("🟢 Seasonal response:", response);
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
    } catch (error) {
      console.error("🔴 Error in loadSeasonalLeaderboard:", error);
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
    } catch (error) {
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
    } catch (error) {
      toast(t("season_change_error"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeSeasons = async () => {
      console.log("🔵 Initializing seasons");
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
      } catch (error) {
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
  }, [sortBy]);

  if (!usersData.length && !isLoading) {
    return <PageLoadingLayout />;
  }

  return (
    <LeadboardLayout
      usersData={usersData}
      setSortBy={setSortBy}
      sortBy={sortBy}
      currentUserId={currentUserId}
      isLoading={isLoading}
      totalUsers={totalUsers}
      currentPage={currentPage}
      itemsPerPage={ITEMS_PER_PAGE}
      onPageChange={handlePageChange}
      isSeasonalView={isSeasonalView}
      setIsSeasonalView={handleViewChange}
      seasons={seasons}
      selectedSeason={selectedSeason}
      setSelectedSeason={handleSeasonChange}
    />
  );
};

export default LeadboardView;
