import { HeroBanner } from "components/UI/HeroBanner";
import ReportView from "feature/user/view/ReportView";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const ReportPage: NextPageWithLayout = () => {

  return (
    <div className="bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen lg:mt-16">
      <HeroBanner
        title="Log Session"
        subtitle="Record and review your practice session"
        eyebrow="Practice Log"
        className="w-full !rounded-none !shadow-none min-h-[100px] md:min-h-[90px] lg:min-h-[100px]"
      />
      <ReportView />
    </div>
  );
};

ReportPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout
      pageId={"report"}
      subtitle="Report"
      variant='primary'>
      {page}
    </AppLayout>
  );
};

export default ReportPage;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: [
        "common",
        "report",
        "profile",
        "achievements",
        "toast",
        "skills"
  ],
});
