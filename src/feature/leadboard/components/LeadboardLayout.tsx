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
          <span className='loading loading-spinner loading-lg'></span>
        </div>
      );
    }

    if (!usersData.length) {
      return (
        <div className='flex h-[50vh] items-center justify-center'>
          <p className='text-lg text-gray-500'>
            {isSeasonalView ? t("no_seasonal_data_found") : t("no_users_found")}
          </p>
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
        <div className='flex justify-center py-4'>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      </>
    );
  };

  return (
    <MainContainer title='Leadboard'>
      <ul className='min-h-screen '>
        <div className='sticky top-0 z-10 flex w-full flex-col gap-4 p-2 px-4 backdrop-blur-sm'>
          <div className='flex flex-col justify-between  gap-2 md:flex-row md:items-center'>
            <div className='flex flex-wrap items-center gap-4 font-openSans '>
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

            <div className='flex items-center gap-4'>
              <UserStats
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalUsers={totalUsers}
              />
            </div>
          </div>
        </div>

        <div className='container mx-auto'>{renderLeaderboardContent()}</div>
      </ul>
    </MainContainer>
  );
};
