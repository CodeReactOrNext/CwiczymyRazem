import { LeadboardView } from "feature/leadboard/LeadboardView";
import useAutoLogIn from "hooks/useAutoLogIn";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import type { NextPage } from "next";
import Head from "next/head";
import { withAuth } from "utils/auth/serverAuth";
import AppLayout from "layouts/AppLayout";

import { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

const SeasonsPage: NextPageWithLayout = () => {
  const siteUrl = "https://riff.quest/seasons";

  return (
    <>
      <Head>
        <link rel='canonical' href={siteUrl} />
      </Head>
      <LeadboardView defaultView='seasonal' />
    </>
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
