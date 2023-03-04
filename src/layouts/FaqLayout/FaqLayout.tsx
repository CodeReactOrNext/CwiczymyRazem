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
    <div className='m-auto flex w-full max-w-[1280px] flex-col gap-8 p-8 '>
      {faqQuestion.map(({ title, message }) => (
        <FaqBox key={title} title={title} message={message} />
      ))}
    </div>
  );
};
export default FaqLayout;
