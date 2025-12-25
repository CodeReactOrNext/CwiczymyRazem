import { LeadboardView } from "feature/leadboard/LeadboardView";
import type { NextPage } from "next";
import Head from "next/head";
import { withAuth } from "utils/auth/serverAuth";

const GlobalLeaderboard: NextPage = () => {
  const siteUrl = "https://riff.quest/leaderboard/global";

  return (
    <>
      <Head>
        <link rel='canonical' href={siteUrl} />
      </Head>
      <LeadboardView defaultView="all-time" />
    </>
  );
};

export default GlobalLeaderboard;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "leadboard", "footer"],
});
