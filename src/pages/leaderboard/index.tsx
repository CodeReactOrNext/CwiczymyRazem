import { LeadboardView } from "feature/leadboard/LeadboardView";
import useAutoLogIn from "hooks/useAutoLogIn";
import AppLayout from "layouts/AppLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import type { NextPage } from "next";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nextConfig from "../../../next-i18next.config";

import { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

const LeaderBoardPage: NextPageWithLayout = () => {
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
      {isLoggedIn ? <LeadboardView /> : <PageLoadingLayout />}
    </>
  );
};

LeaderBoardPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={"leadboard"} subtitle='Leaderboard' variant='secondary'>
      {page}
    </AppLayout>
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
