import PageLoadingLayout from "layouts/PageLoadingLayout";
import ReportView from "feature/user/view/ReportView";
import useAutoLogIn from "hooks/useAutoLogIn";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import MainLayout from "layouts/MainLayout";
import { useTranslation } from "react-i18next";

const ReportPage: NextPage = () => {
  const { t } = useTranslation("report");
  const { isLoggedIn } = useAutoLogIn({
    redirects: {
      loggedOut: "/login",
    },
  });

  return (
    <MainLayout subtitle={t("subtitlebar_text")} variant='primary'>
      {!isLoggedIn ? <PageLoadingLayout /> : <ReportView />}
    </MainLayout>
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
      ])),
    },
  };
}
