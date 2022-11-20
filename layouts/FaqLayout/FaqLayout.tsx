import MainLayout from "layouts/MainLayout";
import FaqBox from "./component/FaqBox";

export interface faqQuestionType {
  title: string;
  message: string;
}

interface FaqLayoutProps {
  faqQuestion: faqQuestionType[];
}

const FaqLayout = ({ faqQuestion }: FaqLayoutProps) => {
  return (
    <MainLayout subtitle='FAQ' variant='secondary'>
      <div className='flex  w-full flex-col gap-8 p-8'>
        {faqQuestion.map(({ title, message }, index) => (
          <FaqBox key={index} title={title} message={message} />
        ))}
      </div>
    </MainLayout>
  );
};
export default FaqLayout;
