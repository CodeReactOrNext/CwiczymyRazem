import { LeadboardLayout } from "feature/leadboard/components/LeadboardLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";

import { useCurrentUser } from "./hooks/useCurrentUser";
import type { LeaderboardViewType } from "./hooks/useLeaderboard";
import { useLeaderboard } from "./hooks/useLeaderboard";
import { useUserRank } from "./hooks/useUserRank";

const ITEMS_PER_PAGE = 10;

interface LeadboardViewProps {
  defaultView?: LeaderboardViewType;
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
    view,
    seasons,
    selectedSeason,
    handlePageChange,
    handleSeasonChange,
    lastAccessiblePage,
  } = useLeaderboard({
    itemsPerPage: ITEMS_PER_PAGE,
    defaultView,
  });

  const { userRank, isLoading: isRankLoading } = useUserRank(
    view,
    selectedSeason
  );

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
      view={view}
      seasons={seasons}
      selectedSeason={selectedSeason}
      setSelectedSeason={handleSeasonChange}
      lastAccessiblePage={lastAccessiblePage}
      userRank={userRank}
      isRankLoading={isRankLoading}
    />
  );
};
