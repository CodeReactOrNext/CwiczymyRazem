import { LeadboardView } from "feature/leadboard/LeadboardView";
import useAutoLogIn from "hooks/useAutoLogIn";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import type { NextPage } from "next";
import Head from "next/head";
import { withAuth } from "utils/auth/serverAuth";
import AppLayout from "layouts/AppLayout";

const SeasonsPage: NextPage = () => {
  const siteUrl = "https://riff.quest/seasons";

  return (
    <>
      <Head>
        <link rel='canonical' href={siteUrl} />
      </Head>
      <AppLayout
        pageId={"seasons"}
        subtitle='Seasons'
        variant='secondary'>
        <LeadboardView defaultView='seasonal' />
      </AppLayout>
    </>
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
