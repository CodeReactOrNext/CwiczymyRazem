import type { NextPage } from "next";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import nextI18nextConfig from "../../next-i18next.config";
import LandingPage from "./landing";

const Home: NextPage = () => {
  const siteUrl = "https://riff.quest";

  return (
    <>
      <Head>
        <link rel='canonical' href={siteUrl} />
      </Head>
      <LandingPage />
    </>
  );
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
