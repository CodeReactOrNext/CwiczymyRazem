import LandingView from "feature/user/view/LandingView";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const Dashboard: NextPageWithLayout = () => {
  return <LandingView />;
};

Dashboard.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout
      pageId="profile"
      subtitle="Dashboard"
      variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default Dashboard;

Dashboard.getInitialProps = withAuthInitialProps();
