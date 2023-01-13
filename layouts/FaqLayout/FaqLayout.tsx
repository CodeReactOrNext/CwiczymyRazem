import FaqBox from "./components/FaqBox";
export interface faqQuestionInterface {
  title: string;
  message: string;
}
interface FaqLayoutProps {
  faqQuestion: faqQuestionInterface[];
}

const FaqLayout = ({ faqQuestion }: FaqLayoutProps) => {
  return (
    <div className='flex  w-full flex-col gap-8 p-8'>
      {faqQuestion.map(({ title, message }, index) => (
        <FaqBox key={index} title={title} message={message} />
      ))}
    </div>
  );
};
export default FaqLayout;
