import { StatsSection } from "feature/profile/components/StatsSection";
import { getUserStatsField } from "assets/stats/profileStats";
import type { StatsFieldProps } from "feature/profile/components/StatsField";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "react-i18next";
import nextI18nextConfig from "../../../next-i18next.config";
import { useAppSelector } from "store/hooks";
import AppLayout from "layouts/AppLayout";
import { ExercisePlan } from "feature/exercisePlan/components/ExercisePlan";

import { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

const ProfileExercisesPage: NextPageWithLayout = () => {
  const { t } = useTranslation("profile");
  const userStats = useAppSelector(selectCurrentUserStats);
  const userAuth = useAppSelector(selectUserAuth);

  return (
    <div className='w-full'>
      <ExercisePlan />
    </div>
  );
};

ProfileExercisesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout
      pageId={"profile"}
      subtitle="Exercises"
      variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default ProfileExercisesPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "pl",
        ["common", "profile", "exercises", "rating_popup"],
        nextI18nextConfig
      )),
    },
  };
}
