import type { NextPage } from "next";
import { useTranslation } from "react-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import MainLayout from "layouts/MainLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";

import useAutoLogIn from "hooks/useAutoLogIn";
import ReportView from "feature/user/view/ReportView";

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
