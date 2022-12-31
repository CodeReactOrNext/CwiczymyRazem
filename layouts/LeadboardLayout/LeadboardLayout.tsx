import MainLayout from "layouts/MainLayout";
import LeadboardColumn from "./components/LeadboardColumn/LeadboardColumn";
import { FirebaseUserDataInterface } from "utils/firebase/firebase.types";

interface LeadboardLayoutProps {
  usersData: FirebaseUserDataInterface[];
}

const LeadboardLayout = ({ usersData }: LeadboardLayoutProps) => {
  return (
    <MainLayout subtitle='Leadboard' variant='secondary'>
      {usersData.map((user, index) => (
        <LeadboardColumn
          key={index}
          place={index + 1}
          nick={user.displayName}
          userAvatar={user.avatar}
          statistics={user.statistics}
        />
      ))}
    </MainLayout>
  );
};

export default LeadboardLayout;
