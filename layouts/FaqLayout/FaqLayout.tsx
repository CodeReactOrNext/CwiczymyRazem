import MainLayout from "layouts/MainLayout";
import { useTranslation } from "react-i18next";
import FaqBox from "./components/FaqBox";
export interface faqQuestionInterface {
  title: string;
  message: string;
}
interface FaqLayoutProps {
  faqQuestion: faqQuestionInterface[];
}

const FaqLayout = ({ faqQuestion }: FaqLayoutProps) => {
  const { t } = useTranslation("faq");
  return (
    <MainLayout subtitle={t("faq")} variant='secondary'>
      <div className='flex  w-full flex-col gap-8 p-8'>
        {faqQuestion.map(({ title, message }, index) => (
          <FaqBox key={index} title={title} message={message} />
        ))}
      </div>
    </MainLayout>
  );
};
export default FaqLayout;
