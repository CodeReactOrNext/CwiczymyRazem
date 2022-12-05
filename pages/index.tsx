import LandingView from "feature/user/view/LandingView/LandingView";
import { selectUserAuth } from "feature/user/store/userSlice";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useAppSelector } from "store/hooks";
import HeroView from "views/HeroView";

const Home: NextPage = () => {
  const isUserLoggedIn = useAppSelector(selectUserAuth);
  return isUserLoggedIn ? <LandingView /> : <HeroView />;
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
