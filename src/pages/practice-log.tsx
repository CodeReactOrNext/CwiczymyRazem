import { cn } from "assets/lib/utils";
import { PAGE_GUTTER, PageShell } from "components/PageShell/PageShell";
import { PageTabs } from "components/PageTabs/PageTabs";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { PracticeLogView } from "feature/practiceLog/view/PracticeLogView";
import { useProgressTabs } from "feature/profile/hooks/useProgressTabs";
import { useTranslation } from "hooks/useTranslation";
import AppLayout from "layouts/AppLayout";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const PracticeLogPage: NextPageWithLayout = () => {
  const tabs = useProgressTabs();
  const router = useRouter();
  const { t } = useTranslation(["practice_log", "nav"]);

  return (
    <PageShell>
      <HeroBanner
        title={t("nav:page_tabs.practice_log.label")}
        subtitle={t("practice_log:hero.subtitle")}
        eyebrow={t("practice_log:hero.eyebrow")}
        buttonText={t("practice_log:hero.add")}
        onClick={() => router.push("/report")}
        backgroundContent={<HeroPattern />}
      />
      <div className={cn(PAGE_GUTTER, "pt-6")}>
        <PageTabs
          tabs={tabs}
          activeHref="/practice-log"
          ariaLabel="Progress sections"
        />
      </div>
      <PracticeLogView />
    </PageShell>
  );
};

PracticeLogPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="practice-log" variant="secondary">
      {page}
    </AppLayout>
  );
};

PracticeLogPage.getInitialProps = withAuthInitialProps();

export default PracticeLogPage;
