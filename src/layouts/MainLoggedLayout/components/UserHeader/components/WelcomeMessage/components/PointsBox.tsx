import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";

export const PointsBox = () => {
  const userStats = useAppSelector(selectCurrentUserStats);
  const points = userStats?.points || 0;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className='hidden h-10 items-center justify-center gap-2 rounded-lg bg-zinc-800/40 px-3 py-2 shadow-sm backdrop-blur-sm sm:flex'>
            <img src="/images/points.png" alt="points" className="h-6 w-6 object-contain" />
            <span className='text-xs font-semibold text-white'>
              {points.toLocaleString()}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className='max-w-[200px] text-center'>
          <p>Points are earned by completing exercises and practice sessions — they track your overall progress.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
