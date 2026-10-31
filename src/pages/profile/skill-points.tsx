import MainContainer from "components/MainContainer";
import { PageTabs } from "components/PageTabs/PageTabs";
import { useProgressTabs } from "feature/profile/hooks/useProgressTabs";
import { SkillPointsPanel } from "feature/skills/components/SkillPointsPanel";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import { useAppSelector } from "store/hooks";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

/**
 * Points and practice time per skill, on its own Progress tab.
 *
 * Reads the skills already loaded with the user's stats — sessions add to them
 * on every report, so there is nothing extra to fetch here.
 */
const ProfileSkillPointsPage = () => {
  const userStats = useAppSelector(selectCurrentUserStats);
  const tabs = useProgressTabs();

  return (
    <MainContainer>
      <div className='p-4'>
        <div className='mb-6'>
          <PageTabs
            tabs={tabs}
            activeHref='/profile/skill-points'
            ariaLabel='Progress sections'
          />
        </div>

        <div className='font-openSans'>
          <SkillPointsPanel
            unlockedSkills={userStats?.skills?.unlockedSkills}
            timeSpent={userStats?.skills?.timeSpent}
          />
        </div>
      </div>
    </MainContainer>
  );
};

ProfileSkillPointsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={"profile"} subtitle='Skills' variant='secondary'>
      {page}
    </AppLayout>
  );
};

ProfileSkillPointsPage.getInitialProps = withAuthInitialProps();

export default ProfileSkillPointsPage;
