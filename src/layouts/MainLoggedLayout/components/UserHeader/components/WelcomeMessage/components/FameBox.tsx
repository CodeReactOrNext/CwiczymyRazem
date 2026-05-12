import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";

import { useAppSelector } from "store/hooks";

export const FameBox = () => {
  const { t } = useTranslation("common");
  const userStats = useAppSelector(selectCurrentUserStats);
  const fame = userStats?.fame || 0;
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className='hidden h-10 cursor-help items-center justify-center gap-2 rounded-lg bg-amber-500/10  px-3 py-2 shadow-sm backdrop-blur-sm md:flex'>
            <img 
              src="/images/coin.png" 
              alt="coin" 
              className="h-6 w-6 object-contain" 
            />
            <span className='text-xs font-bold text-amber-400'>
              {fame.toLocaleString()}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className='max-w-[200px] text-center'>
          <p>{t("tooltip.fame_description")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
