import JourneyView from "feature/journey/view/JourneyView";
import AppLayout from "layouts/AppLayout/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const JourneyPage: NextPageWithLayout = () => {
  return (
    <div className="bg-second-600 flex min-h-screen flex-col overflow-visible rounded-xl border-none shadow-sm lg:mt-16">
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

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "profile", "footer", "toast"],
});
