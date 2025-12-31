import LandingView from "feature/user/view/LandingView";
import { withAuth } from "utils/auth/serverAuth";
import { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import AppLayout from "layouts/AppLayout";

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
