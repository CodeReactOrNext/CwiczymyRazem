import PageLoadingSpinner from "components/PageLoadingSpinner";
import LeadboardLayout from "layouts/LeadboardLayout";
import { useState, useEffect } from "react";
import { firebaseGetUsersExceriseRaprot } from "utils/firebase/firebase.utils";


const LeadboardView = () => {
  const [usersData, setUsersData] = useState<any>(null);

  useEffect(() => {
    firebaseGetUsersExceriseRaprot()
      .then((usersData) =>
        setUsersData(
          usersData.sort((a, b) => b.statistics.points - a.statistics.points)
        )
      )
      .catch((error) => {
        console.log(error);
      });
  }, []);

  return usersData ? (
    <LeadboardLayout usersData={usersData} />
  ) : (
    <PageLoadingSpinner layoutVariant={"secondary"} />
  );
};

export default LeadboardView;
