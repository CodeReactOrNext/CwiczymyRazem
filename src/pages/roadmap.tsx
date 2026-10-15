import { RoadmapView } from "feature/roadmap/RoadmapView";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const RoadmapPage: NextPageWithLayout = () => {
  const siteUrl = "https://riff.quest/roadmap";

  return (
    <div className='flex min-h-screen flex-col overflow-visible rounded-xl border-none bg-second-600'>
      <Head>
        <link rel='canonical' href={siteUrl} />
      </Head>
      <RoadmapView />
    </div>
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
