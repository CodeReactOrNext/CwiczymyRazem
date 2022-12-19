import PageLoadingSpinner from "components/PageLoadingSpinner";
import LeadboardLayout from "layouts/LeadboardLayout";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { FirebaseUserDataInterface } from "utils/firebase/firebase.types";
import { firebaseGetUsersExceriseRaprot } from "utils/firebase/firebase.utils";

const LeadboardView = () => {
  const [usersData, setUsersData] = useState<
    FirebaseUserDataInterface[] | null
  >(null);

  const { t } = useTranslation("leadboard");

  useEffect(() => {
    firebaseGetUsersExceriseRaprot()
      .then((usersData) =>
        setUsersData(
          usersData.sort((a, b) => b.statistics.points - a.statistics.points)
        )
      )
      .catch((error) => {
        console.log(error);
        toast(t("fetch_error"));
      });
  }, [t]);

  return usersData ? (
    <LeadboardLayout usersData={usersData} />
  ) : (
    <PageLoadingSpinner layoutVariant={"secondary"} />
  );
};

export default LeadboardView;
