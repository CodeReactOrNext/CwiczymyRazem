import { LeadboardView } from "feature/leadboard/LeadboardView";
import type { NextPage } from "next";
import { withAuth } from "utils/auth/serverAuth";

const SeasonalLeaderboard: NextPage = () => {
  return <LeadboardView defaultView="seasonal" />;
};

export default SeasonalLeaderboard;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "leadboard", "footer"],
});
