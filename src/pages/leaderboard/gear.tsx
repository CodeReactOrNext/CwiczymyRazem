import { PageShell } from "components/PageShell/PageShell";
import { LeadboardView } from "feature/leadboard/LeadboardView";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const GearLeaderboardPage: NextPageWithLayout = () => {
  const siteUrl = "https://riff.quest/leaderboard/gear";

  return (
    <PageShell>
      <Head>
        <link rel='canonical' href={siteUrl} />
      </Head>
      <LeadboardView defaultView='gear' />
    </PageShell>
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

GearLeaderboardPage.getInitialProps = withAuthInitialProps();
