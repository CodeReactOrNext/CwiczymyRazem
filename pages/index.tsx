import LandingView from "feature/user/view/LandingView";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import HeroView from "views/HeroView";
import useAutoLogIn from "hooks/useAutoLogIn";
import PageLoadingSpinner from "components/PageLoadingSpinner";

const Home: NextPage = () => {
  const { isLoggedIn, isLoading } = useAutoLogIn({});
  return isLoading ? (
    <PageLoadingSpinner layoutVariant={"primary"} />
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
