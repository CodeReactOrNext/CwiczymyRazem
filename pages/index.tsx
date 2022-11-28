import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import MainLayout from "../layouts/MainLayout";
import HeroLayout from "../layouts/HeroLayout";
import Footer from "components/Footer";
import { useTranslation } from "react-i18next";

const Home: NextPage = () => {
  const { t } = useTranslation("landing");

  return (
    <MainLayout
      variant={"landing"}
      subtitle='Ćwicz, raportuj, zdobywaj punkty!'>
      <HeroLayout
        buttonOnClick={() => {
          console.log("Here should be onclick");
        }}>
        <>
          <p>{t("hero_line_1")}</p>
          <p>{t("hero_line_2")}</p>
          <p>{t("hero_line_3")}</p>
          <p>{t("hero_line_4")}</p>
        </>
      </HeroLayout>
      <Footer>
        Obrazy użyte na stronie pochodą z
        <a href='https://www.freepik.com/'> Freepick</a>
      </Footer>
    </MainLayout>
  );
};

export default Home;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "landing"])),
    },
  };
}
