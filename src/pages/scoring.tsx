import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { ScoringGuideView } from "feature/scoring/ScoringGuideView";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const ScoringPage: NextPageWithLayout = () => {
  return (
    <div className='bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen'>
      <HeroBanner
        title='How Points Work'
        subtitle='Every way to earn points, multipliers included'
        eyebrow='Game Rules'
        backgroundContent={<HeroPattern />}
        compact
        className='w-full !rounded-none !shadow-none'
      />
      <ScoringGuideView />
    </div>
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
