import { Breadcrumbs } from "components/Breadcrumbs/Breadcrumbs";
import { PageShell } from "components/PageShell/PageShell";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import ReportView from "feature/user/view/ReportView";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const ReportPage: NextPageWithLayout = () => {

  return (
    <PageShell>
      <HeroBanner
        title="Manual Log"
        subtitle="Record and review your practice session"
        eyebrowContent={
          <Breadcrumbs
            items={[
              { label: "Practice", href: "/timer" },
              { label: "Manual Log" },
            ]}
          />
        }
        backgroundContent={<HeroPattern variant="log" />}
        compact
      />
      <ReportView />
    </PageShell>
  );
};

ReportPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout
      pageId={"report"}
      subtitle="Report"
      variant='primary'>
      {page}
    </AppLayout>
  );
};

export default ReportPage;

ReportPage.getInitialProps = withAuthInitialProps();
