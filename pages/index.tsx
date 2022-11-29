import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "react-i18next";
import MainLayout from "../layouts/MainLayout";
import HeroLayout from "../layouts/HeroLayout";
import Footer from "components/Footer";

const Home: NextPage = () => {
  const { t } = useTranslation(["common", "footer", "landing"]);

  return (
    <MainLayout variant={"landing"} subtitle={t("landing:subtitlebar_text")}>
      <HeroLayout
        buttonOnClick={() => {
          console.log("Here should be onclick");
        }}>
        <>
          <p>{t("landing:hero_line_1")}</p>
          <p>{t("landing:hero_line_2")}</p>
          <p>{t("landing:hero_line_3")}</p>
          <p>{t("landing:hero_line_4")}</p>
        </>
      </HeroLayout>
      <Footer>
        {t("footer:disclaimer")}
        <a href='https://www.freepik.com/'> Freepick</a>
      </Footer>
    </MainLayout>
  );
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
