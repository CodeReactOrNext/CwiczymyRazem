import { TableSkeleton } from "assets/components/ui/table-skeleton";
import { LeadboardRow } from "feature/leadboard/components/LeadboardRow";
import { Pagination } from "feature/leadboard/components/Pagination";
import { useTranslation } from "hooks/useTranslation";
import type { SeasonDataInterface } from "types/api.types";
import type { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";

import SeasonSelect from "./SeasonSelect";
import UserStats from "./UserStats";
import { HeroBanner } from "components/UI/HeroBanner";

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
  seasons: SeasonDataInterface[];
  selectedSeason: string;
  setSelectedSeason: (value: string) => void;
  lastAccessiblePage: number;
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
  seasons,
  selectedSeason,
  setSelectedSeason,
  lastAccessiblePage,
}: LeaderboardProps) => {
  const { t } = useTranslation("leadboard");
  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  const currentSeason = seasons.find(s => s.seasonId === selectedSeason) as SeasonDataInterface | undefined;
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className='min-h-screen flex flex-col'>
      {isSeasonalView && (
        <HeroBanner
          title={currentSeason?.name ?? "Season"}
          subtitle={currentSeason ? `Current season started on ${formatDate(currentSeason.startDate)} and ends on ${formatDate(currentSeason.endDate)}.` : "Practice to climb the leaderboard."}
          backgroundImage="/headers/seasons.png"
          className="w-full !rounded-none !shadow-none"
          rightContent={
            <div className='flex items-center gap-4 bg-black/20 backdrop-blur-md rounded-xl px-6 py-4 border border-white/5'>
              <UserStats
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalUsers={totalUsers}
              />
            </div>
          }
        />
      )}

      <div className='mt-8 mx-auto max-w-7xl px-4 w-full'>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-8'>
          <div className='flex flex-wrap items-center gap-6'>
            {isSeasonalView && (
              <SeasonSelect
                seasons={seasons}
                selectedSeason={selectedSeason}
                setSelectedSeason={setSelectedSeason}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>

        {/* Enhanced Content Container */}
        <div className='pb-20'>
          {isLoading ? (
            <>
              <ul className='flex flex-col gap-6'>
                <TableSkeleton rows={itemsPerPage} />
              </ul>
              <div className='mt-8 flex justify-center'>
                 <div className='h-16 w-64 animate-pulse rounded-2xl bg-zinc-900/30 backdrop-blur-sm' />
              </div>
            </>
          ) : !usersData.length ? (
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
          ) : (
            <>
              <ul className='flex flex-col gap-6'>
                {usersData.map((user, index) => (
                  <LeadboardRow
                    key={user.profileId}
                    profileId={user.profileId}
                    place={(currentPage - 1) * itemsPerPage + index + 1}
                    nick={user.displayName}
                    userAvatar={user.avatar}
                    statistics={user.statistics}
                    currentUserId={currentUserId}
                    selectedFrame={user.selectedFrame}
                    selectedGuitar={user.selectedGuitar}
                  />
                ))}
              </ul>

              {/* Clean Pagination */}
              <div className='mt-8 flex justify-center'>
                <div className='rounded-2xl bg-zinc-900/30 p-4 backdrop-blur-sm'>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                    lastAccessiblePage={lastAccessiblePage}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
