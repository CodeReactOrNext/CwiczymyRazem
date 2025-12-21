import LandingPage from "./landing";
import { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nextConfig from "../../next-i18next.config";

const Home: NextPage = () => {
  return <LandingPage />;
};

export default Home;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
        ...(await serverSideTranslations(
            locale ?? "pl",
            [
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
            nextI18nextConfig
          )),
    },
  };
}
