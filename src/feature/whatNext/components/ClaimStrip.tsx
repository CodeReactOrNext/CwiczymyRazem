import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useClaimMilestone } from "feature/dashboard/hooks/useClaimMilestone";
import { claimQuestRewardAction } from "feature/user/store/userSlice.questActions";
import { useNextMessage } from "feature/whatNext/hooks/useNextMessage";
import type { ClaimItem } from "feature/whatNext/types/whatNext.types";
import { useClaimAchievementRewards } from "hooks/useRewardLedger";
import { ArrowRight, Gift, Ticket } from "lucide-react";
import Link from "next/link";
import posthog from "posthog-js";
import { useAppDispatch } from "store/hooks";

interface ClaimStripProps {
  claims: ClaimItem[];
  /** Card on the page; flat inside the Home card. */
  variant?: "card" | "flat";
  className?: string;
}

const Reward = ({ claim }: { claim: ClaimItem }) => (
  <>
    {!!claim.reward?.fame && (
      <span className='flex items-center gap-1 tabular-nums text-amber-400'>
        <img
          src='/images/tokens/coin.png'
          alt=''
          className='h-3 w-3 object-contain'
        />
        +{claim.reward.fame}
      </span>
    )}
    {!!claim.reward?.caseTokens && (
      <span className='flex items-center gap-1 tabular-nums text-cyan-300'>
        <Ticket size={12} />+{claim.reward.caseTokens}
      </span>
    )}
  </>
);

/**
 * Everything that can be taken without playing, in one place. The ones the
 * app pays in place go out together on one button; the rest link to where
 * they are collected (a free case is opened on the shelf, not "claimed").
 */
export const ClaimStrip = ({
  claims,
  variant = "card",
  className,
}: ClaimStripProps) => {
  const { t, text } = useNextMessage();
  const dispatch = useAppDispatch();
  const claimAchievements = useClaimAchievementRewards();
  const claimMilestone = useClaimMilestone();

  if (claims.length === 0) return null;

  const claimOne = (claim: ClaimItem) => {
    if (claim.claim === "dailyQuest") void dispatch(claimQuestRewardAction());
    if (claim.claim === "achievements") claimAchievements.mutate(undefined);
    if (claim.claim === "milestones" && claim.milestone)
      claimMilestone.mutate(claim.milestone);
  };

  const inline = claims.filter((claim) => claim.claim);
  const claimAll = () => {
    inline.forEach(claimOne);
    posthog.capture("what_next_claim_all", { count: inline.length });
  };

  const rowClass =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 hover:bg-zinc-800/50";

  return (
    <section
      className={cn(
        variant === "card" && "rounded-lg bg-zinc-900/40 p-4 sm:p-5",
        className,
      )}>
      <div className='mb-2 flex items-center justify-between gap-3'>
        <h3 className='flex items-center gap-2 text-sm font-semibold text-zinc-100'>
          <Gift size={16} className='text-amber-400' aria-hidden />
          {t("claims.title")}
        </h3>
        {inline.length > 1 && (
          <Button
            size='sm'
            variant='subtle'
            onClick={claimAll}
            loading={claimAchievements.isPending || claimMilestone.isPending}>
            {t("claims.claim_all")}
          </Button>
        )}
      </div>
      <ul className='-mx-3 space-y-0.5'>
        {claims.map((claim) => (
          <li key={claim.id}>
            {claim.claim ? (
              <button
                type='button'
                onClick={() => {
                  claimOne(claim);
                  posthog.capture("what_next_claim", { kind: claim.claim });
                }}
                className={rowClass}>
                <span className='min-w-0 flex-1 truncate'>
                  {text(claim.label)}
                </span>
                <span className='flex items-center gap-3 text-xs font-medium'>
                  <Reward claim={claim} />
                </span>
              </button>
            ) : (
              <Link href={claim.href} className={rowClass}>
                <span className='min-w-0 flex-1 truncate'>
                  {text(claim.label)}
                </span>
                <span className='flex items-center gap-3 text-xs font-medium'>
                  <Reward claim={claim} />
                  <ArrowRight size={14} className='text-zinc-500' aria-hidden />
                </span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};
