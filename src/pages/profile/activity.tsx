import ActivityLog from "components/ActivityLog/ActivityLog";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { ActivityChart } from "components/Charts/ActivityChart";
import { PracticeInsights } from "feature/profile/components/PracticeInsights/PracticeInsights";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "store/hooks";
import { StatisticsDataInterface } from "types/api.types";
import AuthLayoutWrapper from "wrappers/AuthLayoutWrapper";

const ProfileActivityPage = () => {
  const { t } = useTranslation("profile");
  const userStats = useAppSelector(selectCurrentUserStats);
  const userAuth = useAppSelector(selectUserAuth);
  const { reportList } = useActivityLog(userAuth as string);

  return (
    <AuthLayoutWrapper
      pageId={"profile"}
      subtitle={t("activity", "Activity")}
      variant='secondary'>
      <>
        <div className='font-openSans flex flex-col gap-4'>
          <PracticeInsights
            userAuth={userAuth as string}
            statistics={userStats as StatisticsDataInterface}
           />
          <ActivityChart data={reportList as any} />
        </div>
        <div className='d-flex justify-content-center mt-6'>
          <ActivityLog userAuth={userAuth} />
        </div>
      </>
    </AuthLayoutWrapper>
  );
};

export default ProfileActivityPage;
