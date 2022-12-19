import MainLayout from "layouts/MainLayout";
import { firebaseGetUsersExceriseRaprot } from "utils/firebase/firebase.utils";
import LeadboardColumn from "./components/LeadboardColumn/LeadboardColumn";
import { useState, useEffect } from "react";
import { statistics } from "utils/firebase/userStatisticsInitialData";

const LeadboardLayout = () => {
  const [usersData, setUsersData] = useState<any>(null);

  useEffect(() => {
    firebaseGetUsersExceriseRaprot()
      .then((usersData) =>
        setUsersData(
          usersData.sort(
            (a, b) =>
              b.statistics.points - a.statistics.points
          )
        )
      )
      .catch((error) => {
        console.log(error);
      });
  }, []);

  return (
    <MainLayout subtitle='Leadboard' variant='secondary'>
      <div>
       
        {usersData &&
          usersData.map((user, index) => (
            <LeadboardColumn
              key={index}
              place={index + 1}
              nick={user.displayName}
              statistics={user.statistics}
            />
          ))}
      </div>
    </MainLayout>
  );
};

export default LeadboardLayout;
