import ReportView from "feature/user/view/ReportView";
import { useTranslation } from "hooks/useTranslation";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const ReportPage: NextPageWithLayout = () => {

  return <ReportView />;
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
