import LandingView from "feature/user/view/LandingView";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import HeroView from "views/HeroView";
import useAutoLogIn from "hooks/useAutoLogIn";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import MainLayout from "layouts/MainLayout";
import { useEffect } from "react";

const Home: NextPage = () => {
  const { isLoggedIn, isLoading } = useAutoLogIn({
    redirects: {},
  });
  useEffect(() => {
    console.log("LoggedIn", isLoggedIn);
    console.log("Loading", isLoading);
    return () => {};
  }, [isLoggedIn, isLoading]);

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
      ])),
    },
  };
}
