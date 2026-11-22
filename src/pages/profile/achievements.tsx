import MainContainer from "components/MainContainer";
import { PAGE_CONTENT } from "components/PageShell/PageShell";
import { PageTabs } from "components/PageTabs/PageTabs";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { AchievementsPanel } from "feature/achievements";
import SeasonalAchievements from "feature/profile/components/SeasonalAchievements/SeasonalAchievements";
import { useProgressTabs } from "feature/profile/hooks/useProgressTabs";
import { selectCurrentUserStats, selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import { useAppSelector } from "store/hooks";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

/**
 * The collection, on its own tab.
 *
 * Behind a route of its own rather than appended to Activity: 77 badges is a
 * screen, not a section, and nothing here — including the holo cards, which
 * carry a motion instance apiece — mounts until a player asks for it.
 */
const ProfileAchievementsPage = () => {
  const { t } = useTranslation("achievements");
  const userAuth = useAppSelector(selectUserAuth);
  const userStats = useAppSelector(selectCurrentUserStats);
  const tabs = useProgressTabs();

  return (
    <MainContainer noBorder>
      <HeroBanner
        title={t("page.title")}
        subtitle={t("page.subtitle")}
        eyebrow={t("page.eyebrow")}
        backgroundContent={<HeroPattern />}
      />

      <div className={PAGE_CONTENT}>
        <div className='mb-6'>
          <PageTabs
            tabs={tabs}
            activeHref='/profile/achievements'
            ariaLabel='Progress sections'
          />
        </div>

        <AchievementsPanel
          userAchievements={userStats?.achievements ?? []}
          afterSummary={
            <SeasonalAchievements
              userId={userAuth ?? undefined}
              hideWhenEmpty
            />
          }
        />
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
ProfileAchievementsPage.getInitialProps = withAuthInitialProps();

export default ProfileAchievementsPage;
