import LandingPage from "./landing";
import { withAuth } from "utils/auth/serverAuth";
import { NextPage } from "next";

const Home: NextPage = () => {
  return <LandingPage />;
};

export default Home;

export const getServerSideProps = withAuth({
  redirectIfAuthenticated: "/dashboard",
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
