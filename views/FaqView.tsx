import FaqLayout, { faqQuestionInterface } from "layouts/FaqLayout/FaqLayout";
import { useTranslation } from "react-i18next";

const FaqView = () => {
  const { t } = useTranslation("faq");
  const faqQuestion: faqQuestionInterface[] = [
    {
      title: t("about_title"),
      message: t("about_description"),
    },
    {
      title: t("how_its_work_title"),
      message: t("how_its_work_description"),
    },
    {
      title: t("about_points_title"),
      message: t("about_points_description"),
    },
    {
      title: t("several_times_repotr_title"),
      message: t("several_times_repotr_description"),
    },
    {
      title: t("about_excerise_title"),
      message: t("about_excerise_description"),
    },
  ];

  return <FaqLayout faqQuestion={faqQuestion} />;
};

export default FaqView;
