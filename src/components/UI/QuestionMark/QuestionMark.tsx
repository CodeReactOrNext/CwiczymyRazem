import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { RiQuestionLine } from "react-icons/ri";

export interface QuestionMarkProps {
  description?: string;
}

const QuestionMark = ({ description }: QuestionMarkProps) => {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger>
          <div>
            <RiQuestionLine className='cursor-help fill-secondText text-[22px] hover:fill-mainText' />
          </div>
        </TooltipTrigger>
        {description && (
          <TooltipContent className='max-w-[300px]'>
            {description}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

export default QuestionMark;
