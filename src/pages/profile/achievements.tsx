import MainContainer from "components/MainContainer";
import { PageTabs } from "components/PageTabs/PageTabs";
import { AchievementsPanel } from "feature/achievements";
import SeasonalAchievements from "feature/profile/components/SeasonalAchievements/SeasonalAchievements";
import { useProgressTabs } from "feature/profile/hooks/useProgressTabs";
import { selectCurrentUserStats, selectUserAuth } from "feature/user/store/userSlice";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import { useAppSelector } from "store/hooks";
import { withAuth } from "utils/auth/serverAuth";

/**
 * The collection, on its own tab.
 *
 * Behind a route of its own rather than appended to Activity: 77 badges is a
 * screen, not a section, and nothing here — including the holo cards, which
 * carry a motion instance apiece — mounts until a player asks for it.
 */
const ProfileAchievementsPage = () => {
  const userAuth = useAppSelector(selectUserAuth);
  const userStats = useAppSelector(selectCurrentUserStats);
  const tabs = useProgressTabs();

  return (
    <MainContainer>
      <div className='p-4'>
        <div className='mb-6'>
          <PageTabs
            tabs={tabs}
            activeHref='/profile/achievements'
            ariaLabel='Progress sections'
          />
        </div>

        <div className='font-openSans flex flex-col gap-8'>
          <SeasonalAchievements userId={userAuth as string} hideWhenEmpty />
          <AchievementsPanel userAchievements={userStats?.achievements ?? []} />
        </div>
      </div>
    </MainContainer>
  );
};

ProfileAchievementsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={"profile"} subtitle='Achievements' variant='secondary'>
      {page}
    </AppLayout>
  );
};

// Gated like Practice Log, the other tab in this group: the page has nothing
// to show a signed-out visitor.
export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
});

export default ProfileAchievementsPage;
