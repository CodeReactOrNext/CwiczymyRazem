import JourneyView from "feature/journey/view/JourneyView";
import AppLayout from "layouts/AppLayout/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const JourneyPage: NextPageWithLayout = () => <JourneyView />;

JourneyPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="journey" subtitle="Guitar Journey" variant="secondary" corridor="path">
      {page}
    </AppLayout>
  );
};

export default JourneyPage;

JourneyPage.getInitialProps = withAuthInitialProps();
