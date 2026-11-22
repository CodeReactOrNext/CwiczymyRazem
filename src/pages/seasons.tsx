import { PageShell } from "components/PageShell/PageShell";
import { LeadboardView } from "feature/leadboard/LeadboardView";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const SeasonsPage: NextPageWithLayout = () => {
  const siteUrl = "https://riff.quest/seasons";

  return (
    <PageShell>
      <Head>
        <link rel='canonical' href={siteUrl} />
      </Head>
      <LeadboardView defaultView='seasonal' />
    </PageShell>
  );
};

SeasonsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout
      pageId={"seasons"}
      subtitle='Seasons'
      variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default SeasonsPage;

SeasonsPage.getInitialProps = withAuthInitialProps();
