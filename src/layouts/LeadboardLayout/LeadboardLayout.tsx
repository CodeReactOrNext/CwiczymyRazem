import { Dispatch, SetStateAction } from "react";

import SortBySwitch from "./components/SortBySwitch";
import LeadboardColumn from "./components/LeadboardRow";

import { SortByType } from "feature/leadboard/view/LeadboardView";
import { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";
import MainContainer from "components/MainContainer";

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
}: LeadboardLayoutProps) => {
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
        key="first"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="btn btn-sm join-item"
      >
        «
      </button>
    );
    buttons.push(
      <button
        key="prev"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="btn btn-sm join-item"
      >
        ‹
      </button>
    );

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`btn btn-sm join-item ${
            currentPage === i ? "btn-active" : ""
          }`}
        >
          {i}
        </button>
      );
    }

    // Next and last page
    buttons.push(
      <button
        key="next"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="btn btn-sm join-item"
      >
        ›
      </button>
    );
    buttons.push(
      <button
        key="last"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="btn btn-sm join-item"
      >
        »
      </button>
    );

    return buttons;
  };

  return (
    <MainContainer title={"Leadboard"}>
      <ul className='min-h-screen'>
        <div className='sticky top-0 z-10 flex w-full justify-between p-2 px-4 backdrop-blur-sm'>
          <div className="text-sm text-gray-600">
            {`Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
              currentPage * itemsPerPage,
              totalUsers
            )} of ${totalUsers} users`}
          </div>
          <SortBySwitch setSortBy={setSortBy} sortBy={sortBy} />
        </div>

        <div className='container mx-auto'>
          {isLoading ? (
            <div className="flex justify-center p-4">
              <span className="loading loading-spinner loading-lg"></span>
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
          
          <div className="flex justify-center py-4">
            <div className="join">{renderPaginationButtons()}</div>
          </div>
        </div>
      </ul>
    </MainContainer>
  );
};

export default LeadboardLayout;
