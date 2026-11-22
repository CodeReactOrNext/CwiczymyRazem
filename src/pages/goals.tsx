import { cn } from "assets/lib/utils";
import { PAGE_GUTTER, PageShell } from "components/PageShell/PageShell";
import { PageTabs } from "components/PageTabs/PageTabs";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { LIBRARY_HERO_CLASS, LIBRARY_TABS } from "constants/navTabs";
import { GoalsView } from "feature/exerciseGoals/components/GoalsView";
import { useTranslation } from "hooks/useTranslation";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const GoalsPage: NextPageWithLayout = () => {
  const { t } = useTranslation("goals");

  return (
    <PageShell>
      <HeroBanner
        title={t("page.title")}
        subtitle={t("page.subtitle")}
        eyebrow={t("page.eyebrow")}
        className={LIBRARY_HERO_CLASS}
        backgroundContent={<HeroPattern />}
      />
      <div className={cn(PAGE_GUTTER, "pt-6")}>
        <PageTabs tabs={LIBRARY_TABS} activeHref='/goals' ariaLabel='My stuff sections' />
      </div>
      <GoalsView />
    </PageShell>
  );
};

GoalsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId='goals' variant='secondary'>
      {page}
    </AppLayout>
  );
};

GoalsPage.getInitialProps = withAuthInitialProps();

export default GoalsPage;
