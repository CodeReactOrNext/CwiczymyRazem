import ReportView from "feature/user/view/ReportView";
import useAutoLogIn from "hooks/useAutoLogIn";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import type { NextPage } from "next";
import { useTranslation } from "react-i18next";
import { withAuth } from "utils/auth/serverAuth";
import AppLayout from "layouts/AppLayout";

const ReportPage: NextPage = () => {
  const { t } = useTranslation("report");


  return (
    <AppLayout
      pageId={"report"}
      subtitle={t("subtitlebar_text")}
      variant='primary'>
      <ReportView />
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
