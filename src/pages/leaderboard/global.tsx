import { LeadboardView } from "feature/leadboard/LeadboardView";
import type { NextPage } from "next";
import { withAuth } from "utils/auth/serverAuth";

const GlobalLeaderboard: NextPage = () => {
  return <LeadboardView defaultView="all-time" />;
};

export default GlobalLeaderboard;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "leadboard", "footer"],
});
