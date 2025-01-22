import ReportView from "feature/user/view/ReportView";
import useAutoLogIn from "hooks/useAutoLogIn";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "react-i18next";
import AuthLayoutWrapper from "wrappers/AuthLayoutWrapper";

const ReportPage: NextPage = () => {
  const { t } = useTranslation("report");
  const { isLoggedIn } = useAutoLogIn({
    redirects: {
      loggedOut: "/login",
    },
  });

  return (
    <AuthLayoutWrapper
      pageId={"report"}
      subtitle={t("subtitlebar_text")}
      variant='primary'>
      {!isLoggedIn ? <PageLoadingLayout /> : <ReportView />}
    </AuthLayoutWrapper>
  );
};

export default ReportPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", [
        "common",
        "report",
        "profile",
        "achievements",
        "toast",
        "skills"
      ])),
    },
  };
}
