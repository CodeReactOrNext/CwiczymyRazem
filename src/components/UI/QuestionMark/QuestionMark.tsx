import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { CircleQuestionMark } from "lucide-react";

export interface QuestionMarkProps {
  description?: string;
  className?: string;
}

const QuestionMark = ({ description, className }: QuestionMarkProps) => {
  return (
    <span className='hidden sm:inline-flex'>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger>
            <div>
              <CircleQuestionMark size='1em' className={cn('cursor-help fill-secondText text-[22px] hover:fill-mainText transition-all', className)} />
            </div>
          </TooltipTrigger>
          {description && (
            <TooltipContent className='max-w-[300px]'>
              {description}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </span>
  );
};

export default QuestionMark;
