import LandingView from "feature/user/view/LandingView";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

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

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: [
    "common",
    "profile",
    "footer",
    "achievements",
    "toast",
    "skills",
    "songs",
    "chat",
    "my_plans",
    "exercises",
    "skills",
  ],
});
