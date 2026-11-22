import { PageShell } from "components/PageShell/PageShell";
import { RoadmapView } from "feature/roadmap/RoadmapView";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const RoadmapPage: NextPageWithLayout = () => {
  const siteUrl = "https://riff.quest/roadmap";

  return (
    <PageShell>
      <Head>
        <link rel='canonical' href={siteUrl} />
      </Head>
      <RoadmapView />
    </PageShell>
  );
};

RoadmapPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={"roadmap"} subtitle='Roadmap' variant='primary'>
      {page}
    </AppLayout>
  );
};

export default RoadmapPage;

RoadmapPage.getInitialProps = withAuthInitialProps();
