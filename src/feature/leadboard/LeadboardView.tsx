import { LeadboardLayout } from "feature/leadboard/components/LeadboardLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import { useTranslation } from "react-i18next";

import { useCurrentUser } from "./hooks/useCurrentUser";
import { useLeaderboard } from "./hooks/useLeaderboard";

const ITEMS_PER_PAGE = 10;

interface LeadboardViewProps {
  defaultView?: "all-time" | "seasonal";
}

export const LeadboardView = ({
  defaultView = "all-time",
}: LeadboardViewProps = {}) => {
  const { t } = useTranslation("leadboard");
  const { currentUserId } = useCurrentUser();

  const {
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
    lastAccessiblePage,
  } = useLeaderboard({
    itemsPerPage: ITEMS_PER_PAGE,
    defaultView,
  });

  if (!usersData.length && !isLoading) {
    return <PageLoadingLayout />;
  }

  return (
    <LeadboardLayout
      usersData={usersData}
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
      lastAccessiblePage={lastAccessiblePage}
    />
  );
};
