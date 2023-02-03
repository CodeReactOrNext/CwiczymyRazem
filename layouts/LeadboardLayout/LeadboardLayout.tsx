import LeadboardColumn from "./components/LeadboardRow";
import { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";
import SortBySwitch from "./components/SortBySwitch";
import { Dispatch, SetStateAction } from "react";
import { sortBy } from "feature/leadboard/view/LeadboardView";

interface LeadboardLayoutProps {
  usersData: FirebaseUserDataInterface[];
  setSortBy: Dispatch<SetStateAction<sortBy>>;
}

const LeadboardLayout = ({ usersData, setSortBy }: LeadboardLayoutProps) => {
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
        />
      ))}
    </ul>
  );
};

export default LeadboardLayout;
