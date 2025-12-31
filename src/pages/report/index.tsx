import ReportView from "feature/user/view/ReportView";
import useAutoLogIn from "hooks/useAutoLogIn";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import type { NextPage } from "next";
import { useTranslation } from "react-i18next";
import { withAuth } from "utils/auth/serverAuth";
import AppLayout from "layouts/AppLayout";

import { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

const ReportPage: NextPageWithLayout = () => {
  const { t } = useTranslation("report");

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
