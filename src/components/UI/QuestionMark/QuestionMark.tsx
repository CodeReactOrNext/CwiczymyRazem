import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { RiQuestionLine } from "react-icons/ri";
import { cn } from "assets/lib/utils";

export interface QuestionMarkProps {
  description?: string;
  className?: string;
}

const QuestionMark = ({ description, className }: QuestionMarkProps) => {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger>
          <div>
            <RiQuestionLine className={cn('cursor-help fill-secondText text-[22px] hover:fill-mainText transition-all', className)} />
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
