import { PageTabs } from "components/PageTabs/PageTabs";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { PROGRESS_TABS } from "constants/navTabs";
import { PracticeLogView } from "feature/practiceLog/view/PracticeLogView";
import AppLayout from "layouts/AppLayout";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const PracticeLogPage: NextPageWithLayout = () => {
  const router = useRouter();

  return (
    <div className="bg-second-600 rounded-lg overflow-visible flex flex-col min-h-screen">
      <HeroBanner
        title="Practice Log"
        subtitle="Browse, filter and edit your practice history day by day"
        eyebrow="Your history"
        buttonText="Add Log"
        onClick={() => router.push("/report")}
        backgroundContent={<HeroPattern />}
        className="w-full !rounded-none !shadow-none min-h-[100px] md:min-h-[90px] lg:min-h-[100px] mb-6"
      />
      <div className="mb-6 px-4 md:px-6">
        <PageTabs
          tabs={PROGRESS_TABS}
          activeHref="/practice-log"
          ariaLabel="Progress sections"
        />
      </div>
      <PracticeLogView />
    </div>
  );
};

PracticeLogPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="practice-log" variant="secondary" wide>
      {page}
    </AppLayout>
  );
};

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
});

export default PracticeLogPage;
