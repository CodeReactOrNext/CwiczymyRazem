import { LeadboardView } from "feature/leadboard/LeadboardView";
import useAutoLogIn from "hooks/useAutoLogIn";
import AppLayout from "layouts/AppLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import Head from "next/head";
import type { ReactElement } from "react";
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


