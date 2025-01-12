import { toast } from "sonner";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAppSelector } from "store/hooks";
import { useTranslation } from "react-i18next";
import { SeasonDataInterface } from "types/api.types";

import LeadboardLayout from "layouts/LeadboardLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";

import { selectUserAuth } from "feature/user/store/userSlice";
import { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";
import {
  firebaseGetUsersExceriseRaport,
  getTotalUsersCount,
  getSeasonalLeaderboard,
  getCurrentSeason,
  getAvailableSeasons,
} from "utils/firebase/client/firebase.utils";

export type SortByType = "points" | "sessionCount";

const LeadboardView = () => {
  const [usersData, setUsersData] = useState<FirebaseUserDataInterface[]>([]);
  const [sortBy, setSortBy] = useState<SortByType>("points");
  const [isLoading, setIsLoading] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 30;
  const [isSeasonalView, setIsSeasonalView] = useState(false);
  const [seasons, setSeasons] = useState<SeasonDataInterface[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("");

  const { t } = useTranslation("leadboard");
  const currentUserId = useAppSelector(selectUserAuth);

  const loadUsers = async (page: number) => {
    try {
      setIsLoading(true);
      const response = await firebaseGetUsersExceriseRaport(
        sortBy,
        page,
        ITEMS_PER_PAGE
      );
      setUsersData(response.users);
    } catch (error) {
      toast(t("fetch_error"));
    } finally {
      setIsLoading(false);
    }
  };

  const loadTotalCount = async () => {
    try {
      const count = await getTotalUsersCount();
      setTotalUsers(count);
    } catch (error) {
      console.error("Error fetching total count:", error);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadUsers(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const loadSeasonalUsers = async (seasonId: string) => {
    try {
      setIsLoading(true);
      const response = await getSeasonalLeaderboard(
        seasonId,
        sortBy,
        currentPage,
        ITEMS_PER_PAGE
      );
      setUsersData(response.users);
    } catch (error) {
      toast(t("fetch_error"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTotalCount();
    setCurrentPage(1);
    loadUsers(1);
  }, [sortBy]);

  useEffect(() => {
    const loadSeasons = async () => {
      const seasonsData = await getAvailableSeasons();
      setSeasons(seasonsData);

      const currentSeason = await getCurrentSeason();
      setSelectedSeason(currentSeason.seasonId);
    };

    loadSeasons();
  }, []);

  useEffect(() => {
    if (isSeasonalView && selectedSeason) {
      loadSeasonalUsers(selectedSeason);
    } else {
      loadUsers(currentPage);
    }
  }, [isSeasonalView, selectedSeason, sortBy, currentPage]);

  return (
    <>
      {usersData.length > 0 || isLoading ? (
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
          setIsSeasonalView={setIsSeasonalView}
          seasons={seasons}
          selectedSeason={selectedSeason}
          setSelectedSeason={setSelectedSeason}
        />
      ) : (
        <PageLoadingLayout />
      )}
    </>
  );
};

export default LeadboardView;
