import { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { SeasonDataInterface } from "types/api.types";


import { SortByType } from "feature/leadboard/view/LeadboardView";
import { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";
import MainContainer from "components/MainContainer";
import SortBySwitch from "feature/leadboard/components/SortBySwitch";

interface LeadboardLayoutProps {
  usersData: FirebaseUserDataInterface[];
  setSortBy: Dispatch<SetStateAction<SortByType>>;
  sortBy: SortByType;
  currentUserId: string | null;
  isLoading: boolean;
  totalUsers: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  isSeasonalView: boolean;
  setIsSeasonalView: Dispatch<SetStateAction<boolean>>;
  seasons: SeasonDataInterface[];
  selectedSeason: string;
  setSelectedSeason: Dispatch<SetStateAction<string>>;
}

const LeadboardLayout = ({
  usersData,
  setSortBy,
  currentUserId,
  sortBy,
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
}: LeadboardLayoutProps) => {
  const { t } = useTranslation("leadboard");

  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5; // Number of page buttons to show

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page and previous
    buttons.push(
      <button
        key='first'
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className='btn join-item btn-sm'>
        «
      </button>
    );
    buttons.push(
      <button
        key='prev'
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className='btn join-item btn-sm'>
        ‹
      </button>
    );

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`btn join-item btn-sm ${
            currentPage === i ? "btn-active" : ""
          }`}>
          {i}
        </button>
      );
    }

    // Next and last page
    buttons.push(
      <button
        key='next'
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className='btn join-item btn-sm'>
        ›
      </button>
    );
    buttons.push(
      <button
        key='last'
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className='btn join-item btn-sm'>
        »
      </button>
    );

    return buttons;
  };

  return (
    <MainContainer title={"Leadboard"}>
      <ul className='min-h-screen'>
        <div className='sticky top-0 z-10 flex w-full flex-col gap-4 p-2 px-4 backdrop-blur-sm'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div className='join'>
                <button
                  className={`btn join-item btn-sm ${
                    !isSeasonalView ? "btn-primary" : ""
                  }`}
                  onClick={() => setIsSeasonalView(false)}>
                  {t("global_leaderboard")}
                </button>
                <button
                  className={`btn join-item btn-sm ${
                    isSeasonalView ? "btn-primary" : ""
                  }`}
                  onClick={() => setIsSeasonalView(true)}>
                  {t("seasonal_leaderboard")}
                </button>
              </div>

              {isSeasonalView && (
                <select
                  className='select select-bordered select-sm'
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}>
                  {seasons.map((season) => (
                    <option key={season.seasonId} value={season.seasonId}>
                      {new Date(season.startDate).toLocaleDateString()} -{" "}
                      {new Date(season.endDate).toLocaleDateString()}
                      {season.isActive && ` (${t("current_season")})`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className='flex items-center gap-4'>
              <div className='text-sm text-gray-600'>
                {`${t("showing")} ${
                  (currentPage - 1) * itemsPerPage + 1
                }-${Math.min(currentPage * itemsPerPage, totalUsers)} ${t(
                  "of"
                )} ${totalUsers} ${t("users")}`}
              </div>
              <SortBySwitch setSortBy={setSortBy} sortBy={sortBy} />
            </div>
          </div>
        </div>

        <div className='container mx-auto'>
          {isLoading ? (
            <div className='flex justify-center p-4'>
              <span className='loading loading-spinner loading-lg'></span>
            </div>
          ) : (
            <>
              {usersData.map((user, index) => (
                <LeadboardColumn
                  key={user.profileId}
                  profileId={user.profileId}
                  place={(currentPage - 1) * itemsPerPage + index + 1}
                  nick={user.displayName}
                  userAvatar={user.avatar}
                  statistics={user.statistics}
                  currentUserId={currentUserId}
                />
              ))}
            </>
          )}

          <div className='flex justify-center py-4'>
            <div className='join'>{renderPaginationButtons()}</div>
          </div>
        </div>
      </ul>
    </MainContainer>
  );
};

export default LeadboardLayout;
