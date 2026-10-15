import JourneyView from "feature/journey/view/JourneyView";
import AppLayout from "layouts/AppLayout/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const JourneyPage: NextPageWithLayout = () => {
  return (
    <div className="flex min-h-screen flex-col overflow-visible rounded-lg bg-zinc-950 lg:mt-16">
      <JourneyView />
    </div>
  );
};

JourneyPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="journey" subtitle="Guitar Journey" variant="secondary">
      {page}
    </AppLayout>
  );
};

export default JourneyPage;

JourneyPage.getInitialProps = withAuthInitialProps();
