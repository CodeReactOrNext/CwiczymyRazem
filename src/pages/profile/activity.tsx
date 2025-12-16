import ActivityLog from "components/ActivityLog/ActivityLog";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { ActivityChart } from "components/Charts/ActivityChart";
import MainContainer from "components/MainContainer";
import { DetailedStats } from "feature/profile/components/DetailedStats/DetailedStats";
import { PracticeInsights } from "feature/profile/components/PracticeInsights/PracticeInsights";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import type { Song } from "feature/songs/types/songs.type";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "store/hooks";
import { StatisticsDataInterface } from "types/api.types";
import AppLayout from "layouts/AppLayout";

const ProfileActivityPage: NextPage = () => {
  const { t } = useTranslation("profile");
  const userStats = useAppSelector(selectCurrentUserStats);
  const userAuth = useAppSelector(selectUserAuth);
  const { reportList } = useActivityLog(userAuth as string);
  const [songs, setSongs] = useState<{
    wantToLearn: Song[];
    learning: Song[];
    learned: Song[];
  }>();

  useEffect(() => {
    if (userAuth) {
      getUserSongs(userAuth).then((songs) => setSongs(songs));
    }
  }, [userAuth]);

  return (
    <AppLayout
      pageId={"profile"}
      subtitle={t("activity", "Activity")}
      variant='secondary'>
      <MainContainer title={"Activity"}>
        <div className='p-4'>
          <div className='font-openSans flex flex-col gap-6'>
            <PracticeInsights statistics={userStats} />

            {userStats && (
              <DetailedStats
                statistics={userStats as StatisticsDataInterface}
                userSongs={songs}
              />
            )}

            <ActivityChart data={reportList as any} />
          </div>

          <div className='mt-8'>
            <ActivityLog userAuth={userAuth as string} />
          </div>
        </div>
      </MainContainer>
    </>
  );
};

export default ProfileActivityPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", [
        "common",
        "profile",
        "skills",
        "achievements",
        "songs",
      ])),
    },
  };
}
