import { PageTabs } from "components/PageTabs/PageTabs";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { GoalsView } from "feature/exerciseGoals/components/GoalsView";
import { useProgressTabs } from "feature/profile/hooks/useProgressTabs";
import { useTranslation } from "hooks/useTranslation";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const GoalsPage: NextPageWithLayout = () => {
  const { t } = useTranslation("goals");
  const tabs = useProgressTabs();

  return (
    <div className='bg-second-600 flex min-h-screen flex-col overflow-visible rounded-lg'>
      <HeroBanner
        title={t("page.title")}
        subtitle={t("page.subtitle")}
        eyebrow={t("page.eyebrow")}
        eyebrowClassName='text-emerald-400/80'
        backgroundContent={<HeroPattern />}
        className='mb-6 min-h-[100px] w-full !rounded-none !shadow-none md:min-h-[90px] lg:min-h-[100px]'
      />
      <div className='px-3 md:px-6 lg:px-8'>
        <PageTabs tabs={tabs} activeHref='/goals' ariaLabel='Progress sections' />
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

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
});

export default GoalsPage;
