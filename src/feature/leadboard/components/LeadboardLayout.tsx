import MainContainer from "components/MainContainer";
import { LeadboardRow } from "feature/leadboard/components/LeadboardRow";
import { Pagination } from "feature/leadboard/components/Pagination";
import { useTranslation } from "react-i18next";
import type { SeasonDataInterface } from "types/api.types";
import type { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";

import SeasonSelect from "./SeasonSelect";
import UserStats from "./UserStats";
import ViewToggle from "./ViewToggle";

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
      return (
        <div className='flex h-[50vh] items-center justify-center'>
          <div className='text-center'>
            <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-600 border-t-cyan-400'></div>
            <p className='text-lg font-medium text-zinc-300'>
              Ładowanie rankingu...
            </p>
            <p className='text-sm text-zinc-500'>
              Pobieranie danych użytkowników
            </p>
          </div>
        </div>
      );
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
          <div className='bg-zinc-900/30 p-4 backdrop-blur-sm'>
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
        {/* Enhanced Header */}
        <div className='sticky top-0 z-10 mb-8 rounded-xl border border-zinc-700/50 bg-zinc-900/80 shadow-2xl backdrop-blur-xl'>
          <div className='p-6'>
            <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
              {/* Left Section - Controls */}
              <div className='flex flex-wrap items-center gap-4'>
                <ViewToggle
                  isSeasonalView={isSeasonalView}
                  setIsSeasonalView={setIsSeasonalView}
                  isLoading={isLoading}
                />
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
              <div className='flex items-center gap-4'>
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
          <ul className='space-y-0'>{renderLeaderboardContent()}</ul>
        </div>
      </div>
    </MainContainer>
  );
};
