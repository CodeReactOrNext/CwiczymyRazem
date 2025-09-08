import { StatsSection } from "feature/profile/components/StatsSection";
import { getUserStatsField } from "assets/stats/profileStats";
import type { StatsFieldProps } from "feature/profile/components/StatsField";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "store/hooks";
import AuthLayoutWrapper from "wrappers/AuthLayoutWrapper";
import { ExercisePlan } from "feature/exercisePlan/components/ExercisePlan";

const ProfileExercisesPage = () => {
  const { t } = useTranslation("profile");
  const userStats = useAppSelector(selectCurrentUserStats);
  const userAuth = useAppSelector(selectUserAuth);

  return (
    <AuthLayoutWrapper
      pageId={"profile"}
      subtitle={t("exercises", "Exercises")}
      variant='secondary'>
      <div className='w-full'>
        <ExercisePlan />
      </div>
    </AuthLayoutWrapper>
  );
};

export default ProfileExercisesPage;
