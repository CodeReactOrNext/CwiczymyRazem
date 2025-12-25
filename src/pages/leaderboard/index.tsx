import { LeadboardView } from "feature/leadboard/LeadboardView";
import useAutoLogIn from "hooks/useAutoLogIn";
import AppLayout from "layouts/AppLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import type { NextPage } from "next";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nextConfig from "../../../next-i18next.config";

const LeaderBoardPage: NextPage = () => {
  const { isLoggedIn } = useAutoLogIn({
    redirects: {
      loggedOut: "/login",
    },
  });

  const siteUrl = "https://riff.quest/leaderboard";

  return (
    <>
      <Head>
        <link rel='canonical' href={siteUrl} />
      </Head>
      <AppLayout pageId={"leadboard"} subtitle='Leaderboard' variant='secondary'>
        {isLoggedIn ? <LeadboardView /> : <PageLoadingLayout />}
      </AppLayout>
    </>
  );
};

export default LeaderBoardPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "pl",
        ["common", "leadboard", "achievements", "toast"],
        nextI18nextConfig
      )),
    },
  };
}
