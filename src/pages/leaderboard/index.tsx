import { LeadboardView } from "feature/leadboard/LeadboardView";
import useAutoLogIn from "hooks/useAutoLogIn";
import AppLayout from "layouts/AppLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const LeaderBoardPage: NextPage = () => {
  const { isLoggedIn } = useAutoLogIn({
    redirects: {
      loggedOut: "/login",
    },
  });

  return (
    <AppLayout pageId={"leadboard"} subtitle='Leaderboard' variant='secondary'>
      {isLoggedIn ? <LeadboardView /> : <PageLoadingLayout />}
    </AppLayout>
  );
};

export default LeaderBoardPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", [
        "common",
        "leadboard",
        "achievements",
        "toast",
      ])),
    },
  };
}
