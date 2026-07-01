import { LeadboardView } from "feature/leadboard/LeadboardView";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const GearLeaderboardPage: NextPageWithLayout = () => {
  const siteUrl = "https://riff.quest/leaderboard/gear";

  return (
    <div className="bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen ">
      <Head>
        <link rel='canonical' href={siteUrl} />
      </Head>
      <LeadboardView defaultView='gear' />
    </div>
  );
};

GearLeaderboardPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout
      pageId={"gear-leaderboard"}
      subtitle='Gear Leaderboard'
      variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default GearLeaderboardPage;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: [
    "common",
    "leadboard",
    "achievements",
    "toast",
  ],
});
