import { ToolTip } from "components/UI";
import { RiQuestionLine } from "react-icons/ri";

export interface QuestionMarkProps {
  description?: string;
}

const QuestionMark = ({ description }: QuestionMarkProps) => {
  return (
    <>
      <div
        className='tooltip relative z-50 font-openSans'
        data-tip={description}>
        <RiQuestionLine className='cursor-help fill-secondText  text-[22px] hover:fill-mainText' />
      </div>
    </>
  );
};
export default QuestionMark;
