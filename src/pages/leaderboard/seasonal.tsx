import { LeadboardView } from "feature/leadboard/LeadboardView";
import type { NextPage } from "next";
import Head from "next/head";
import { withAuth } from "utils/auth/serverAuth";

const SeasonalLeaderboard: NextPage = () => {
  const siteUrl = "https://riff.quest/leaderboard/seasonal";

  return (
    <>
      <Head>
        <link rel='canonical' href={siteUrl} />
      </Head>
      <LeadboardView defaultView="seasonal" />
    </>
  );
};

export default SeasonalLeaderboard;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "leadboard", "footer"],
});
