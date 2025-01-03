import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAppSelector } from "store/hooks";
import { useTranslation } from "react-i18next";

import LeadboardLayout from "layouts/LeadboardLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";

import { selectUserAuth } from "feature/user/store/userSlice";
import { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";
import { firebaseGetUsersExceriseRaport as firebaseGetUsersExceriseRaport } from "utils/firebase/client/firebase.utils";

export type SortByType = "points" | "time" | "sessionCount";

const LeadboardView = () => {
  const [usersData, setUsersData] = useState<
    FirebaseUserDataInterface[] | null
  >(null);
  const [sortBy, setSortBy] = useState<SortByType>("points");

  const { t } = useTranslation("leadboard");
  const currentUserId = useAppSelector(selectUserAuth);

  const sortByTime = (
    a: FirebaseUserDataInterface,
    b: FirebaseUserDataInterface
  ) => {
    const { creativity, hearing, technique, theory } = a.statistics.time;
    const {
      creativity: creativityB,
      hearing: hearingB,
      technique: techniqueB,
      theory: theoryB,
    } = b.statistics.time;
    return (
      creativityB +
      hearingB +
      techniqueB +
      theoryB -
      (creativity + hearing + technique + theory)
    );
  };

  const sortByPoints = (
    a: FirebaseUserDataInterface,
    b: FirebaseUserDataInterface
  ) => {
    return b.statistics.points - a.statistics.points;
  };

  const sortBySessionCount = (
    a: FirebaseUserDataInterface,
    b: FirebaseUserDataInterface
  ) => {
    return b.statistics.sessionCount - a.statistics.sessionCount;
  };

  useEffect(() => {
    firebaseGetUsersExceriseRaport()
      .then((usersData) =>
        setUsersData(
          usersData.sort((a, b) => {
            if (sortBy === "time") return sortByTime(a, b);
            if (sortBy === "sessionCount") return sortBySessionCount(a, b);
            return sortByPoints(a, b);
          })
        )
      )
      .catch((error) => {
        toast(t("fetch_error"));
      });
  }, [sortBy, t]);

  return (
    <>
      {usersData ? (
        <LeadboardLayout
          usersData={usersData}
          setSortBy={setSortBy}
          sortBy={sortBy}
          currentUserId={currentUserId}
        />
      ) : (
        <PageLoadingLayout />
      )}
    </>
  );
};

export default LeadboardView;
