import PageLoadingSpinner from "components/PageLoadingSpinner";
import ReportView from "feature/user/view/ReportView";
import useAutoLogIn from "hooks/useAutoLogIn";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const ReportPage: NextPage = () => {
  const { isLoggedIn } = useAutoLogIn({
    redirects: {
      loggedOut: "/login",
    },
  });

  return !isLoggedIn ? (
    <PageLoadingSpinner layoutVariant='primary' />
  ) : (
    <ReportView />
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
      ])),
    },
  };
}
