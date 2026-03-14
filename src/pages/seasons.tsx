import { LeadboardView } from "feature/leadboard/LeadboardView";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const SeasonsPage: NextPageWithLayout = () => {
  const siteUrl = "https://riff.quest/seasons";

  return (
    <div className="bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen lg:mt-16">
      <Head>
        <link rel='canonical' href={siteUrl} />
      </Head>
      <LeadboardView defaultView='seasonal' />
    </div>
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

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: [
    "common",
    "leadboard",
    "achievements",
    "toast",
  ],
});
