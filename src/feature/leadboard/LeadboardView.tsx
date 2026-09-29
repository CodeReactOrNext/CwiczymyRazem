import { useQuery } from "@tanstack/react-query";
import { LeadboardLayout } from "feature/leadboard/components/LeadboardLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";

import { useCurrentUser } from "./hooks/useCurrentUser";
import type { LeaderboardViewType } from "./hooks/useLeaderboard";
import { useLeaderboard } from "./hooks/useLeaderboard";
import { useUserRank } from "./hooks/useUserRank";
import { getLeaderboardNeighbors } from "./services/getLeaderboardNeighbors";

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

  const {
    userRank,
    score,
    isLoading: isRankLoading,
  } = useUserRank(view, selectedSeason);

  // The slice around the player (who is just above and below), so the page
  // can say who is next without paging down to the player's place.
  const { data: neighbors, isLoading: isNeighborsLoading } = useQuery({
    queryKey: [
      "leaderboardNeighbors",
      view,
      selectedSeason,
      currentUserId,
      score,
      userRank,
    ],
    queryFn: () =>
      getLeaderboardNeighbors({
        view,
        userId: currentUserId!,
        score: score!,
        rank: userRank!,
        seasonId: view === "seasonal" ? selectedSeason : undefined,
      }),
    enabled:
      !!currentUserId &&
      score !== null &&
      !!userRank &&
      (view !== "seasonal" || !!selectedSeason),
    staleTime: 5 * 60 * 1000,
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
      view={view}
      seasons={seasons}
      selectedSeason={selectedSeason}
      setSelectedSeason={handleSeasonChange}
      lastAccessiblePage={lastAccessiblePage}
      userRank={userRank}
      isRankLoading={isRankLoading}
      neighbors={neighbors ?? null}
      isNeighborsLoading={isNeighborsLoading}
    />
  );
};
