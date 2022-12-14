import LandingView from "feature/user/view/LandingView/LandingView";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import HeroView from "views/HeroView";
import useAutoLogIn from "hooks/useAutoLogIn";

const Home: NextPage = () => {
  const { isLoggedIn } = useAutoLogIn();
  return isLoggedIn ? <LandingView /> : <HeroView />;
};

export default Home;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", [
        "common",
        "landing",
        "footer",
      ])),
    },
  };
}
