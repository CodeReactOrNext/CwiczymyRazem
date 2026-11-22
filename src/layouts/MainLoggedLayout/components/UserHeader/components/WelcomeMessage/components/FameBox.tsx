import { PRESSABLE_KEY } from "assets/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { useRouter } from "next/router";
import { useAppSelector } from "store/hooks";

export const FameBox = () => {
  const router = useRouter();
  const { t } = useTranslation("common");
  const userStats = useAppSelector(selectCurrentUserStats);
  const fame = userStats?.fame || 0;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button
            onClick={() => router.push("/arsenal")}
            type='button'
            className={cn(
              PRESSABLE_KEY,
              "fame-chip hidden h-11 items-center justify-center gap-2 rounded-lg bg-amber-500/10 px-3 transition-colors hover:bg-amber-500/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:flex"
            )}>
            <img
              src="/images/tokens/coin.png"
              alt="fame"
              className="h-6 w-6 object-contain"
            />
            <span className='fame-chip-text text-xs font-bold text-amber-400'>
              {fame.toLocaleString()}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent className='max-w-[200px] text-center'>
          <p>{t("tooltip.fame_description")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
