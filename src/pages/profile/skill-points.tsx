import MainContainer from "components/MainContainer";
import { PageTabs } from "components/PageTabs/PageTabs";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { useProgressTabs } from "feature/profile/hooks/useProgressTabs";
import {
  SkillPointsPanel,
  SkillPointsTotal,
} from "feature/skills/components/SkillPointsPanel";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import { useAppSelector } from "store/hooks";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

/**
 * Points and practice time per skill, on its own Progress tab.
 *
 * Reads the skills already loaded with the user's stats — sessions add to them
 * on every report, so there is nothing extra to fetch here. The hero mirrors
 * Activity's, with the skill-point total where Activity shows the level.
 */
const ProfileSkillPointsPage = () => {
  const { t } = useTranslation("skills");
  const userStats = useAppSelector(selectCurrentUserStats);
  const tabs = useProgressTabs();
  const unlockedSkills = userStats?.skills?.unlockedSkills;
  const timeSpent = userStats?.skills?.timeSpent;

  return (
    <MainContainer noBorder>
      <HeroBanner
        title={t("points_panel.title")}
        subtitle={t("points_panel.subtitle")}
        eyebrow={t("points_panel.eyebrow")}
        backgroundContent={<HeroPattern />}
        rightContent={
          <div className='flex h-full w-full items-center md:justify-end'>
            <SkillPointsTotal
              unlockedSkills={unlockedSkills}
              timeSpent={timeSpent}
            />
          </div>
        }
        className='min-h-[140px] w-full !flex-col !rounded-none !shadow-none md:min-h-[120px] md:!flex-row lg:min-h-[160px]'
      />

      <div className='p-4'>
        <div className='mb-6'>
          <PageTabs
            tabs={tabs}
            activeHref='/profile/skill-points'
            ariaLabel='Progress sections'
          />
        </div>

        <SkillPointsPanel
          unlockedSkills={unlockedSkills}
          timeSpent={timeSpent}
        />
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
