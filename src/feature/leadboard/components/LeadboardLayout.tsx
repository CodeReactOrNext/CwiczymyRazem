import MainContainer from "components/MainContainer";
import { LeadboardRow } from "feature/leadboard/components/LeadboardRow";
import { Pagination } from "feature/leadboard/components/Pagination";
import { useTranslation } from "react-i18next";
import type { SeasonDataInterface } from "types/api.types";
import type { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";

import SeasonSelect from "./SeasonSelect";
import UserStats from "./UserStats";
import ViewToggle from "./ViewToggle";
import { TableSkeleton } from "assets/components/ui/table-skeleton";

export type SortByType = "points" | "sessionCount";

export interface LeaderboardProps {
  usersData: FirebaseUserDataInterface[];
  currentUserId: string | null;
  isLoading: boolean;
  totalUsers: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  isSeasonalView: boolean;
  setIsSeasonalView: (value: boolean) => void;
  seasons: SeasonDataInterface[];
  selectedSeason: string;
  setSelectedSeason: (value: string) => void;
}

export const LeadboardLayout = ({
  usersData,
  currentUserId,
  isLoading,
  totalUsers,
  currentPage,
  itemsPerPage,
  onPageChange,
  isSeasonalView,
  setIsSeasonalView,
  seasons,
  selectedSeason,
  setSelectedSeason,
}: LeaderboardProps) => {
  const { t } = useTranslation("leadboard");
  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  const renderLeaderboardContent = () => {
    if (isLoading) {
      return <TableSkeleton rows={itemsPerPage} />;
    }

    if (!usersData.length) {
      return (
        <div className='flex h-[50vh] items-center justify-center'>
          <div className='text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50'>
              <span className='text-2xl'>📊</span>
            </div>
            <h3 className='mb-2 text-xl font-semibold text-zinc-300'>
              {isSeasonalView ? "Brak danych sezonowych" : "Brak użytkowników"}
            </h3>
            <p className='text-sm text-zinc-500'>
              {isSeasonalView
                ? t("no_seasonal_data_found")
                : t("no_users_found")}
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
        {usersData.map((user, index) => (
          <LeadboardRow
            key={user.profileId}
            profileId={user.profileId}
            place={(currentPage - 1) * itemsPerPage + index + 1}
            nick={user.displayName}
            userAvatar={user.avatar}
            statistics={user.statistics}
            currentUserId={currentUserId}
          />
        ))}

        {/* Clean Pagination */}
        <div className='mt-8 flex justify-center'>
          <div className='rounded-2xl bg-zinc-900/30 p-4 backdrop-blur-sm'>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        </div>
      </>
    );
  };

  return (
    <MainContainer title='Leadboard'>
      <div className='min-h-screen'>
        {/* Enhanced Header - Zen Aesthetic */}
        <div className='sticky top-4 z-20 mb-12 mx-auto max-w-7xl px-4'>
          <div className='rounded-2xl bg-zinc-950/40 p-8 shadow-2xl'>
            <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
              {/* Left Section - Controls */}
              <div className='flex flex-wrap items-center gap-6'>
                <div className="flex flex-col">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 mb-2">Hall of Fame</h2>
                  <h1 className="text-3xl font-black text-white tracking-tight">Leaderboard</h1>
                </div>
                
                <div className="h-10 w-px bg-white/10 hidden lg:block mx-4" />


                {isSeasonalView && (
                  <SeasonSelect
                    seasons={seasons}
                    selectedSeason={selectedSeason}
                    setSelectedSeason={setSelectedSeason}
                    isLoading={isLoading}
                  />
                )}
              </div>

              {/* Right Section - Stats */}
              <div className='flex items-center gap-4 bg-white/5 rounded-xl px-6 py-4'>
                <UserStats
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  totalUsers={totalUsers}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Content Container */}
        <div className='mx-auto max-w-7xl px-4'>
          <ul className='flex flex-col gap-6'>{renderLeaderboardContent()}</ul>
        </div>
      </div>
    </MainContainer>
  );
};
