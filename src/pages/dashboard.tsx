import LandingView from "feature/user/view/LandingView";
import { NextPage } from "next";
import { withAuth } from "utils/auth/serverAuth";

const Dashboard: NextPage = () => {
  return <LandingView />;
};

export default Dashboard;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: [
    "common",
    "profile",
    "footer",
    "achievements",
    "toast",
    "skills",
    "songs",
    "chat",
    "my_plans",
    "exercises",
    "skills",
  ],
});
