import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "assets/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import type { RewardPayout } from "lib/rewards/rewardPayout";
import { Gift } from "lucide-react";
import { useResponsiveStore } from "store/useResponsiveStore";

import { RewardSummary } from "./RewardSummary";

interface RewardBadgeProps {
  reward: RewardPayout;
  /** Earned badges read as something to collect; the rest as a promise. */
  earned: boolean;
  claimed: boolean;
}

/**
 * The reward on one badge, one tap or hover away.
 *
 * Printed inline it was three coloured chips per row across 77 rows, which
 * drowned out the one thing the list is for — which badges are earned and how
 * far the rest are along. Behind a single glyph it costs the row nothing until
 * somebody asks, and what they get when they do can be full size instead of
 * squeezed into eleven pixels of type.
 *
 * Tooltip on the desktop, dialog on mobile — the same split `AchievementCard`
 * makes, for the same reason: there is no hover on a phone.
 */
export const RewardBadge = ({ reward, earned, claimed }: RewardBadgeProps) => {
  const { t } = useTranslation("achievements");
  const isMobileView = useResponsiveStore((state) => state.isMobile);

  const heading = claimed
    ? t("panel.rewards.collected")
    : earned
      ? t("panel.rewards.readyToCollect")
      : t("panel.rewards.onCompletion");

  const trigger = (
    <button
      type='button'
      aria-label={heading}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        claimed
          ? "text-zinc-600 hover:text-zinc-400"
          : earned
            ? "text-cyan-300 hover:bg-cyan-500/10"
            : "text-zinc-500 hover:text-zinc-300",
      )}>
      <Gift size={19} strokeWidth={2.5} />
    </button>
  );

  if (isMobileView) {
    return (
      <Dialog>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className='max-w-[90vw] rounded-2xl border-none bg-zinc-900/95 text-white backdrop-blur-md'>
          <DialogHeader className='gap-5 py-2 text-left'>
            <DialogTitle className='text-base font-bold'>{heading}</DialogTitle>
            <DialogDescription asChild>
              <RewardSummary reward={reward} size='lg' muted={claimed} />
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Tooltip delayDuration={50}>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      {/*
        Dark, unlike the default tooltip: the payout is read by its colours —
        amber Fame, cyan free case, the part's own tier colour — and none of
        those survive being put on a near-white ground.
      */}
      <TooltipContent
        side='left'
        sideOffset={8}
        className='z-[100] flex flex-col gap-3 border-none bg-zinc-900 px-4 py-3.5 text-zinc-100 shadow-xl'>
        <span className='text-[0.6875rem] font-bold tracking-wide text-zinc-500'>
          {heading}
        </span>
        <RewardSummary reward={reward} size='lg' muted={claimed} />
      </TooltipContent>
    </Tooltip>
  );
};
