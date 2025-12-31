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
import nextI18nextConfig from "../../../next-i18next.config";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "store/hooks";
import { StatisticsDataInterface } from "types/api.types";
import AppLayout from "layouts/AppLayout";

import { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

const ProfileActivityPage: NextPageWithLayout = () => {
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
  );
};

ProfileActivityPage.getLayout = function getLayout(page: ReactElement) {
  // We need to useTranslation in getLayout or outside?
  // getLayout is a static function, hooks like useTranslation might work if called inside? content is rendered in React tree.
  // Actually, AppLayout uses useTranslation internally, so we don't need to pass t("activity", "Activity") if we can avoid it.
  // But wait, the title is passed as prop. 
  // We can't use hooks like useTranslation at the top level of getLayout easily if it's just a function component return.
  // BUT the page component executes in a different context.
  // Standard pattern: Wrapper component or just literal string if acceptable, or separate component.
  // However, AppLayout is a component, so it renders.
  // The 'subtitle' prop needs the string.
  // React components used in getLayout are rendered.
  // So we can wrap in a component that uses translation?
  // Or simpler: The AppLayout is inside getLayout function. The getLayout function is called during render of App?
  // No, `getLayout` is called in `_app.tsx` inside the render function. So hooks are generic there?
  // `_app.tsx`: `const getLayout = Component.getLayout ?? ((page) => page);` ... `{getLayout(<Component ... />)}`
  // Yes, getLayout is called inside the functional component `MyApp`, so we CAN use hooks?
  // No, `MyApp` is a component. `getLayout` is a function called within it.
  // If `getLayout` calls `useTranslation`, it's valid if `MyApp` allows it?
  // UseTranslation needs context. `appWithTranslation(MyApp)` wraps MyApp.
  // So `useTranslation` should work inside `getLayout`?
  // No, hooks must be called at the top level of a component. `getLayout` is just a function, not a component.
  // So we cannot call `useTranslation` inside `getLayout`.
  // Solution: create a wrapper component or use fixed strings/pass transalation key.
  // AppLayout might accept translation key? It accepts `subtitle: string`.
  // Looking at AppLayout.tsx: `subtitle` is "Kept for compatibility, unused" on line 15!
  // So we don't need to pass subtitle!
  return (
    <AppLayout
      pageId={"profile"}
      subtitle="Activity" /* unused */
      variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default ProfileActivityPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "pl",
        ["common", "profile", "skills", "achievements", "songs"],
        nextI18nextConfig
      )),
    },
  };
}
