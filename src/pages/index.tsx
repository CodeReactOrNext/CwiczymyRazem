import { useEffect } from "react";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import HeroView from "feature/hero/HeroView";
import MainLayout from "layouts/MainLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";

import useAutoLogIn from "hooks/useAutoLogIn";
import LandingView from "feature/user/view/LandingView";

const Home: NextPage = () => {
  const { isLoggedIn, isLoading } = useAutoLogIn({
    redirects: { loggedOut: "/" },
  });

  return isLoading ? (
    <MainLayout subtitle='' variant='primary'>
      <PageLoadingLayout />
    </MainLayout>
  ) : isLoggedIn ? (
    <LandingView />
  ) : (
    <HeroView />
  );
};

export default Home;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", [
        "common",
        "profile",
        "footer",
        "achievements",
        "toast",
        "skills",
        "songs",
        'chat'
      ])),
    },
  };
}
