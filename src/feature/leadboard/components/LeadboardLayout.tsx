import { TableSkeleton } from "assets/components/ui/table-skeleton";
import { LeadboardRow } from "feature/leadboard/components/LeadboardRow";
import { Pagination } from "feature/leadboard/components/Pagination";
import { useTranslation } from "hooks/useTranslation";
import type { SeasonDataInterface } from "types/api.types";
import type { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";

import SeasonSelect from "./SeasonSelect";
import { SeasonRewards } from "./SeasonRewards";

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
      {isSeasonalView ? (
        <HeroBanner
          title={currentSeason?.name ?? "Season"}
          subtitle={currentSeason ? `${formatDate(currentSeason.startDate)} – ${formatDate(currentSeason.endDate)}` : "Practice to climb the leaderboard."}
          eyebrow="Seasonal ranking"
          className="w-full !rounded-none !shadow-none min-h-[200px] md:min-h-[180px] lg:min-h-[220px]"
          rightContent={
            <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4'>

              <SeasonRewards />
            </div>
          }
        />
      ) : (
        <HeroBanner
          title="Leaderboard"
          subtitle="See how you rank against other players"
          eyebrow="All-time ranking"
          characterImage="/images/3d/leaderboard.png"
          className="w-full !rounded-none !shadow-none min-h-[200px] md:min-h-[180px] lg:min-h-[220px]"
        />
      )}

      <div className='mt-8 mx-auto max-w-7xl px-4 w-full'>
        <div className='flex flex-wrap items-center gap-6 mb-8'>
          {isSeasonalView && (
            <SeasonSelect
              seasons={seasons}
              selectedSeason={selectedSeason}
              setSelectedSeason={setSelectedSeason}
              isLoading={isLoading}
            />
          )}
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
                    selectedGuitarYear={user.selectedGuitarYear}
                    selectedGuitarCountry={user.selectedGuitarCountry}
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
