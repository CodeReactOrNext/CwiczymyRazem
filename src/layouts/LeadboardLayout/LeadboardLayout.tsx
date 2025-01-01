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
}

const LeadboardLayout = ({
  usersData,
  setSortBy,
  currentUserId,
  sortBy,
}: LeadboardLayoutProps) => {
  return (
    <MainContainer title={"Leadboard"}>
      <ul className='min-h-screen'>
        <div className='sticky top-0 z-10 flex w-full justify-end  p-2 px-4 backdrop-blur-sm'>
          <SortBySwitch setSortBy={setSortBy} sortBy={sortBy} />
        </div>

        <div className='container mx-auto'>
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
        </div>
      </ul>
    </MainContainer>
  );
};

export default LeadboardLayout;
