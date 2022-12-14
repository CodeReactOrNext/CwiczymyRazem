import MainLayout from "layouts/MainLayout";
import LeadboardColumn from "./components/LeadboardRow";
import { FirebaseUserDataInterface } from "utils/firebase/firebase.types";

interface LeadboardLayoutProps {
  usersData: FirebaseUserDataInterface[];
}

const LeadboardLayout = ({ usersData }: LeadboardLayoutProps) => {
  return (
    <ul>
      {usersData.map((user, index) => (
        <LeadboardColumn
          profileId={user.profileId}
          key={index}
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
