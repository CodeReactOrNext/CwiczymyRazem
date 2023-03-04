import { Dispatch, SetStateAction } from "react";

import SortBySwitch from "./components/SortBySwitch";
import LeadboardColumn from "./components/LeadboardRow";

import { SortByType } from "feature/leadboard/view/LeadboardView";
import { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";

interface LeadboardLayoutProps {
  usersData: FirebaseUserDataInterface[];
  setSortBy: Dispatch<SetStateAction<SortByType>>;
  sortBy: SortByType;
  currentUserId: string | null;
}

const LeadboardLayout = ({
  usersData,
  setSortBy,
  currentUserId,
  sortBy,
}: LeadboardLayoutProps) => {
  return (
    <ul>
      <div className='flex w-full justify-end p-2 px-4'>
        <SortBySwitch setSortBy={setSortBy} sortBy={sortBy} />
      </div>

      {usersData.map((user, index) => (
        <LeadboardColumn
          profileId={user.profileId}
          key={user.profileId}
          place={index + 1}
          nick={user.displayName}
          userAvatar={user.avatar}
          statistics={user.statistics}
          currentUserId={currentUserId}
        />
      ))}
    </ul>
  );
};

export default LeadboardLayout;
