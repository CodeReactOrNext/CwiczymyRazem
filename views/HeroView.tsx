import Footer from "components/Footer";
import HeroLayout from "layouts/HeroLayout";
import MainLayout from "layouts/MainLayout";
import { useTranslation } from "react-i18next";

const HeroView = () => {
  const { t } = useTranslation(["common", "footer", "profile"]);

  return (
    <MainLayout variant={"landing"} subtitle={t("profile:subtitlebar_text")}>
      <HeroLayout>
        <>
          <p>{t("profile:hero_line_1")}</p>
          <p>{t("profile:hero_line_2")}</p>
          <p>{t("profile:hero_line_3")}</p>
          <p>{t("profile:hero_line_4")}</p>
        </>
      </HeroLayout>
      <Footer>
        {t("footer:disclaimer")}
        <a href='https://www.freepik.com/'> Freepick</a>
      </Footer>
    </MainLayout>
  );
};

export default HeroView;
