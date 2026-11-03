import { LeadboardView } from "feature/leadboard/LeadboardView";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";



const LeaderBoardPage: NextPageWithLayout = () => {
  // AppLayout renders the page only once the player is signed in and redirects
  // otherwise, so the view needs no gate (or placeholder) of its own.
  const siteUrl = "https://riff.quest/leaderboard";

  return (
    <div className="bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen ">
      <Head>
        <link rel='canonical' href={siteUrl} />
      </Head>
      <LeadboardView />
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


