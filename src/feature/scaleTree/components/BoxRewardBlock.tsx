import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { RewardSummary } from "components/Rewards/RewardSummary";
import { PartIcon } from "feature/arsenal/components/Parts/PartIcon";
import { useClaimScaleReward, useRewardLedger } from "hooks/useRewardLedger";
import { Check, Gift, Lock, Ticket } from "lucide-react";

import { boxRewardId, getBoxReward } from "../data/scaleTreeRewards";

interface BoxRewardBlockProps {
  scaleType: string;
  /** The fret this box is anchored at — what the reward is filed under. */
  position: number;
  /** How many of the row's shapes are cleared, and how many there are. */
  done: number;
  total: number;
  /** The family's accent, so the block belongs to the row it closes. */
  accentColor: string;
}

/**
 * The chest at the end of a box.
 *
 * A block rather than another polygon: everything else in the row is a shape to
 * practise, and a reward drawn as one more pentagon on the end of seven of them
 * reads as an eighth exercise. The rectangle is the row saying "this part is
 * over".
 *
 * The payout is printed on the face — the Fame and the part it pays — instead
 * of hiding behind the hover. Five of these down the right-hand edge is the
 * ladder a player climbs the tree on, and a ladder whose rungs are unlabelled
 * motivates nobody. The full breakdown still comes on the tooltip.
 */
export const BoxRewardBlock = ({
  scaleType,
  position,
  done,
  total,
  accentColor,
}: BoxRewardBlockProps) => {
  const reward = getBoxReward(scaleType, position);
  const { data: ledger } = useRewardLedger();
  const { mutate: claim, isPending } = useClaimScaleReward();

  if (!reward || total === 0) return null;

  const isClaimed =
    ledger?.scales.claimed.includes(boxRewardId(scaleType, position)) ?? false;
  const isComplete = done >= total;
  const canClaim = isComplete && !isClaimed;
  const part = reward.parts[0];
  const holdsFreeCase = reward.caseTokens > 0;

  const heading = isClaimed
    ? "Box reward collected"
    : canClaim
      ? "Box cleared — collect it"
      : holdsFreeCase
        ? `${total - done} shapes left — this box finishes the tree`
        : `${total - done} shapes left in this box`;

  const block = (
    <button
      type='button'
      onClick={canClaim ? () => claim({ scaleType, position }) : undefined}
      disabled={!canClaim || isPending}
      aria-label={heading}
      className={cn(
        "relative flex h-[52px] w-[64px] shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-lg transition-colors sm:h-[68px] sm:w-[92px]",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        canClaim
          ? "cursor-pointer bg-zinc-800/70 hover:bg-zinc-700/70"
          : "cursor-default bg-zinc-900/50",
        isPending && "cursor-wait opacity-70",
      )}>
      {/* The row's accent, washed up from the bottom edge — only on the block
          that is actually ready, so a finished row reads down the whole grid. */}
      {canClaim && (
        <span
          aria-hidden
          className='pointer-events-none absolute inset-0'
          style={{
            background: `radial-gradient(100% 80% at 50% 100%, ${accentColor}33 0%, transparent 75%)`,
          }}
        />
      )}

      {/* The box that finishes the tree is the only one carrying a free case,
          and it says so from the first visit — locked or not. It is the thing
          at the top of the ladder, and a ladder is climbed towards something
          visible. */}
      {holdsFreeCase && !isClaimed && (
        <Ticket
          size={12}
          strokeWidth={2.5}
          aria-hidden
          className={cn(
            "absolute right-1.5 top-1.5",
            canClaim ? "text-cyan-300" : "text-cyan-300/40",
          )}
        />
      )}

      {isClaimed ? (
        <Check
          size={20}
          className='relative text-emerald-400'
          strokeWidth={2.5}
        />
      ) : canClaim ? (
        <>
          <Gift
            size={18}
            strokeWidth={2.5}
            className='relative'
            style={{ color: accentColor }}
          />
          <span className='relative flex items-center gap-1 text-[10px] font-bold tabular-nums leading-none text-amber-400'>
            <img
              src='/images/coin.png'
              alt=''
              className='h-3 w-3 object-contain'
            />
            {reward.fame}
            {part && (
              <>
                <PartIcon partId={part.partId} size={12} className='ml-0.5' />
                {part.qty}
              </>
            )}
          </span>
        </>
      ) : (
        <>
          <Lock size={16} className='relative text-zinc-600' strokeWidth={2} />
          <span className='relative text-[10px] font-bold tabular-nums leading-none text-zinc-600'>
            {done}/{total}
          </span>
        </>
      )}
    </button>
  );

  return (
    <Tooltip delayDuration={50}>
      <TooltipTrigger asChild>{block}</TooltipTrigger>
      <TooltipContent
        side='left'
        sideOffset={8}
        className='z-[100] flex flex-col gap-3 border-none bg-zinc-900 px-4 py-3.5 text-zinc-100 shadow-xl'>
        <span className='text-[0.6875rem] font-bold tracking-wide text-zinc-500'>
          {heading}
        </span>
        <RewardSummary reward={reward} size='lg' muted={isClaimed} />
      </TooltipContent>
    </Tooltip>
  );
};
