import { PlayerRoadmapsView } from "feature/supporterPanel/PlayerRoadmapsView";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const MyRoadmapsPage: NextPageWithLayout = () => <PlayerRoadmapsView />;

MyRoadmapsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId='my-roadmaps' variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default MyRoadmapsPage;

MyRoadmapsPage.getInitialProps = withAuthInitialProps();
