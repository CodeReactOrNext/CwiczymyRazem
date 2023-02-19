import { Dispatch, SetStateAction } from "react";

import SortBySwitch from "./components/SortBySwitch";
import LeadboardColumn from "./components/LeadboardRow";

import { sortBy } from "feature/leadboard/view/LeadboardView";
import { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";

interface LeadboardLayoutProps {
  usersData: FirebaseUserDataInterface[];
  setSortBy: Dispatch<SetStateAction<sortBy>>;
  currentUserId: string | null;
}

const LeadboardLayout = ({
  usersData,
  setSortBy,
  currentUserId,
}: LeadboardLayoutProps) => {
  return (
    <ul className='relative'>
      <SortBySwitch setSortBy={setSortBy} />
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
