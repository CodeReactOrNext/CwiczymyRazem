import { RiQuestionnaireFill } from "react-icons/ri";
import ToolTip from "components/ToolTip";

export interface QuestionMarkProps {
  description: string;
}

const QuestionMark = ({ description }: QuestionMarkProps) => {
  return (
    <>
      <ToolTip />
      <RiQuestionnaireFill
        className='cursor-help fill-tertiary text-sm hover:fill-mainText'
        data-tip={description}
      />
    </>
  );
};
export default QuestionMark;
