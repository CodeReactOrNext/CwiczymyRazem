import { PageShell } from "components/PageShell/PageShell";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { ScoringGuideView } from "feature/scoring/ScoringGuideView";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const ScoringPage: NextPageWithLayout = () => {
  return (
    <PageShell>
      <HeroBanner
        title='How Points Work'
        subtitle='Every way to earn points, multipliers included'
        eyebrow='Game Rules'
        backgroundContent={<HeroPattern />}
        compact
      />
      <ScoringGuideView />
    </PageShell>
  );
};

ScoringPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={"scoring"} subtitle='How Points Work' variant='primary'>
      {page}
    </AppLayout>
  );
};

export default ScoringPage;

ScoringPage.getInitialProps = withAuthInitialProps();
