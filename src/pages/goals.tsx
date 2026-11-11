import { PageTabs } from "components/PageTabs/PageTabs";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { LIBRARY_TABS } from "constants/navTabs";
import { GoalsView } from "feature/exerciseGoals/components/GoalsView";
import { useTranslation } from "hooks/useTranslation";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const GoalsPage: NextPageWithLayout = () => {
  const { t } = useTranslation("goals");

  return (
    <div className='bg-second-600 flex min-h-screen flex-col overflow-visible rounded-lg'>
      <HeroBanner
        title={t("page.title")}
        subtitle={t("page.subtitle")}
        compact
        backgroundContent={<HeroPattern />}
        className='mb-2 w-full !rounded-none !shadow-none md:mb-6 md:min-h-[90px] lg:min-h-[100px]'
      />
      <div className='px-3 md:px-6 lg:px-8'>
        <PageTabs tabs={LIBRARY_TABS} activeHref='/goals' ariaLabel='My stuff sections' />
      </div>
      <GoalsView />
    </div>
  );
};

GoalsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId='goals' variant='secondary' wide>
      {page}
    </AppLayout>
  );
};

GoalsPage.getInitialProps = withAuthInitialProps();

export default GoalsPage;
