import ToolTip from "components/ToolTip";
import { RiQuestionnaireFill } from "react-icons/ri";

export interface QuestionMarkProps {
  description: string;
}

const QuestionMark = ({ description }: QuestionMarkProps) => {
  return (
    <>
      <ToolTip />
      <RiQuestionnaireFill
        className='fill-mainText text-sm'
        data-tip={description}
      />
    </>
  );
};
export default QuestionMark;
