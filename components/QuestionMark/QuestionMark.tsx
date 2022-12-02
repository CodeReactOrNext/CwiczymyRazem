import { FaQuestionCircle } from "react-icons/fa";
import ReactTooltip from "react-tooltip";

interface QuestionMarkProps {
  description: string;
}

const QuestionMark = ({ description }: QuestionMarkProps) => {
  return (
    <>
      <ReactTooltip />
      <FaQuestionCircle className='fill-tertiary-500' data-tip={description} />
    </>
  );
};
export default QuestionMark;
