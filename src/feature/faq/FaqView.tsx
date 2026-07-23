import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";
import { FaqLayout } from "feature/faq/components/FaqLayout";
import { useTranslation } from "hooks/useTranslation";

// Shared with the FAQPage JSON-LD in pages/faq/index.tsx so the structured
// data and the rendered accordion can never drift out of sync.
export const useFaqQuestions = (): faqQuestionInterface[] => {
  const { t } = useTranslation("faq");
  return [
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
};

const FaqView = () => {
  const faqQuestions = useFaqQuestions();

  return <FaqLayout faqQuestions={faqQuestions} />;
};

export default FaqView;
