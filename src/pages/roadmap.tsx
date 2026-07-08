import { HeroBanner } from "components/UI/HeroBanner";
import { RoadmapView } from "feature/roadmap/RoadmapView";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const RoadmapPage: NextPageWithLayout = () => {
  const siteUrl = "https://riff.quest/roadmap";

  return (
    <div className='bg-second-600 flex min-h-screen flex-col overflow-visible rounded-xl border-none'>
      <Head>
        <link rel='canonical' href={siteUrl} />
      </Head>
      <HeroBanner
        title='Help build Riff Quest'
        subtitle='Built in the open and paid for by the people who use it. What you support is what gets made next.'
        eyebrow='Community funded'
        compact
        className='w-full !rounded-none !shadow-none'
      />
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

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "toast"],
});
