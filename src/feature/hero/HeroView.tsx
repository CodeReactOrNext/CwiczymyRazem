import { Footer } from "components/Footer/Footer";
import HeroLayout from "layouts/HeroLayout";
import MainHeroLayout from "layouts/MainHeroLayout";
import { useTranslation } from "react-i18next";

const HeroView = () => {
  const { t } = useTranslation(["common", "footer", "profile"]);

  return (
    <MainHeroLayout
      variant={"landing"}
      subtitle={t("profile:subtitlebar_text")}
      minHeightLimit>
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
        <a href='https://www.freepik.com/'> Freepik</a>
        <br />
        {t("footer:authors")}: Michał Jabłoński, Damian Sobieraj
      </Footer>
    </MainHeroLayout>
  );
};

export default HeroView;
 