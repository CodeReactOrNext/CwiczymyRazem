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

  return (
    <div className="bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen ">
      <Head>
        <meta name='robots' content='noindex' />
      </Head>
      {isLoggedIn ? <LeadboardView /> : <PageLoadingLayout />}
    </div>
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


