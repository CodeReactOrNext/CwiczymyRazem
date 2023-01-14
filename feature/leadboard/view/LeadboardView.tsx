import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";


import MainLayout from "layouts/MainLayout";
import LeadboardLayout from "layouts/LeadboardLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";


import { FirebaseUserDataInterface } from "utils/firebase/firebase.types";
import { firebaseGetUsersExceriseRaport as firebaseGetUsersExceriseRaport } from "utils/firebase/firebase.utils";

const LeadboardView = () => {
  const [usersData, setUsersData] = useState<
    FirebaseUserDataInterface[] | null
  >(null);
  const { t } = useTranslation("leadboard");

  useEffect(() => {
    firebaseGetUsersExceriseRaport()
      .then((usersData) =>
        setUsersData(
          usersData.sort((a, b) => b.statistics.points - a.statistics.points)
        )
      )
      .catch((error) => {
        toast(t("fetch_error"));
      });
  }, [t]);

  return (
    <MainLayout subtitle='Leadboard' variant='secondary'>
      {usersData ? (
        <LeadboardLayout usersData={usersData} />
      ) : (
        <PageLoadingLayout />
      )}
    </MainLayout>
  );
};

export default LeadboardView;
