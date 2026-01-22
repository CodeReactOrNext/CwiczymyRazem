import { LeadboardLayout } from "feature/leadboard/components/LeadboardLayout";
import { useTranslation } from "hooks/useTranslation";
import PageLoadingLayout from "layouts/PageLoadingLayout";

import { useCurrentUser } from "./hooks/useCurrentUser";
import { useLeaderboard } from "./hooks/useLeaderboard";

const ITEMS_PER_PAGE = 10;

interface LeadboardViewProps {
  defaultView?: "all-time" | "seasonal";
}

export const LeadboardView = ({
  defaultView = "all-time",
}: LeadboardViewProps = {}) => {
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
      seasons={seasons}
      selectedSeason={selectedSeason}
      setSelectedSeason={handleSeasonChange}
      lastAccessiblePage={lastAccessiblePage}
    />
  );
};
