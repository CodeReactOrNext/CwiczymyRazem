import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import LeadboardView from "feature/leadboard/view/LeadboardView";
import AuthLayoutWrapper from "wrappers/AuthLayoutWrapper";
import useAutoLogIn from "hooks/useAutoLogIn";

const LeaderBoardPage: NextPage = () => {
  const { isLoggedIn } = useAutoLogIn({
    redirects: {
      loggedOut: "/leaderboard",
    },
  });

  return (
    <AuthLayoutWrapper
      pageId={"leadboard"}
      subtitle='Leaderboard'
      variant='secondary'>
      <LeadboardView />
    </AuthLayoutWrapper>
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
