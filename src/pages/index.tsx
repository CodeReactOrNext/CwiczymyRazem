import type { NextPage } from "next";
import Head from "next/head";

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


