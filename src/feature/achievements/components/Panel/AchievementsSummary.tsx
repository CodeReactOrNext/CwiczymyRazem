import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { FreeCaseIcon } from "components/Rewards/FreeCaseIcon";
import { RewardSummary } from "components/Rewards/RewardSummary";
import { PartIcon } from "feature/arsenal/components/Parts/PartIcon";
import { getPartLabel } from "feature/arsenal/data/partDefinitions";
import { useTranslation } from "hooks/useTranslation";
import type { RewardPayout } from "lib/rewards/rewardPayout";
import { ArrowRight, Check, Gift, PackageOpen } from "lucide-react";
import Link from "next/link";

export interface CollectedRewards {
  /** How many badges the claim paid for. */
  count: number;
  /** What the server actually paid — not what the page expected it to. */
  reward: RewardPayout;
}

interface AchievementsSummaryProps {
  owned: number;
  total: number;
  /** Earned badges not paid for yet. Null while the ledger loads. */
  waiting: number | null;
  /** What all of them are worth together. */
  pending: RewardPayout | null;
  /** Requirements met, waiting for the next logged session to unlock. */
  readyCount: number;
  /** Unspent free cases already in the account. */
  caseTokens: number;
  /** The last "Collect all", kept until something new is waiting. */
  collected: CollectedRewards | null;
  isClaiming: boolean;
  onClaimAll: () => void;
}

type Zone = "claim" | "collected" | "cases" | null;

/**
 * The payout as the session summary sets it: token and a Teko "+N" per
 * currency. Parts stack by kind, so a pile of tuners is one figure.
 */
const CollectedFigures = ({ reward }: { reward: RewardPayout }) => {
  const parts = reward.parts.filter((part) => part.qty > 0);

  return (
    <div className='flex flex-wrap items-center gap-x-6 gap-y-2'>
      {reward.fame > 0 && (
        <span className='flex items-center gap-1.5 text-amber-400'>
          <img
            src='/images/tokens/coin.png'
            alt=''
            className='h-6 w-6 object-contain'
          />
          <span className='pt-1 font-teko text-3xl font-semibold tabular-nums leading-none'>
            +{reward.fame.toLocaleString()}
          </span>
        </span>
      )}

      {reward.caseTokens > 0 && (
        <span className='flex items-center gap-1.5 text-cyan-300'>
          <FreeCaseIcon size={24} />
          <span className='pt-1 font-teko text-3xl font-semibold tabular-nums leading-none'>
            +{reward.caseTokens}
          </span>
        </span>
      )}

      {parts.map((part) => (
        <span
          key={`${part.partId}-${part.tier}`}
          title={`${part.qty}× ${part.tier} ${getPartLabel(part.partId)}`}
          className='flex items-center gap-1.5 text-zinc-300'>
          <PartIcon partId={part.partId} size={24} />
          <span className='pt-1 font-teko text-3xl font-semibold tabular-nums leading-none'>
            +{part.qty}
          </span>
        </span>
      ))}
    </div>
  );
};

/** Free cases waiting to be spent, with the way to the shelf they open. */
const CasesInHand = ({
  count,
  openCase = false,
}: {
  count: number;
  /** After a payout: "Open a case". At rest: "Open in Arsenal". */
  openCase?: boolean;
}) => {
  const { t } = useTranslation("achievements");

  return (
    <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
      <span className='flex items-center gap-2 text-[0.8125rem] font-semibold text-zinc-300'>
        <FreeCaseIcon size={22} />
        {count === 1
          ? t("panel.rewards.casesInHandOne")
          : t("panel.rewards.casesInHand", { count })}
      </span>
      <Button asChild variant='ghost' size='sm'>
        <Link href='/arsenal'>
          {openCase
            ? t("panel.rewards.openCase")
            : t("panel.rewards.openArsenal")}
          <ArrowRight />
        </Link>
      </Button>
    </div>
  );
};

/**
 * The top of the collection: how much of it is earned, and what it owes.
 *
 * One card rather than a rewards banner stacked over a progress card — both
 * are about the same collection, and two cards made the payout look like a
 * notice pinned above it rather than part of it.
 *
 * While something is waiting the card is lit amber from the payout's side, the
 * same light the podium rows of a ranking take; after "Collect all" it keeps
 * the payout on show, in the Teko figures the session summary pays out in,
 * instead of vanishing the moment it is pressed.
 */
export const AchievementsSummary = ({
  owned,
  total,
  waiting,
  pending,
  readyCount,
  caseTokens,
  collected,
  isClaiming,
  onClaimAll,
}: AchievementsSummaryProps) => {
  const { t } = useTranslation("achievements");
  const earnedPercent = total > 0 ? Math.round((owned / total) * 100) : 0;

  // The receipt wins over the claim: between the payout and the ledger's
  // refetch the old "waiting" count is still in hand, and the button would
  // flash back for a moment. Anything earned later arrives after a session,
  // on a fresh visit to the page, where `collected` starts empty again.
  const zone: Zone =
    collected && collected.count > 0
      ? "collected"
      : waiting && waiting > 0 && pending
        ? "claim"
        : caseTokens > 0
          ? "cases"
          : null;

  return (
    <div
      className={cn(
        "grid gap-5 rounded-lg bg-zinc-800/40 p-5 sm:items-center sm:p-6",
        zone && "sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-10",
        zone === "claim" &&
          "light-tint bg-gradient-to-l from-amber-400/10 via-transparent to-transparent",
        zone === "collected" &&
          "light-tint bg-gradient-to-l from-emerald-400/10 via-transparent to-transparent",
      )}>
      <div className='flex min-w-0 flex-col gap-2'>
        <div className='flex items-baseline justify-between gap-4'>
          <p className='text-sm font-bold text-zinc-200'>
            {t("panel.earnedHeadline", { owned, total })}
          </p>
          <span className='shrink-0 text-sm font-bold tabular-nums text-zinc-400'>
            ({earnedPercent}%)
          </span>
        </div>
        <div className='h-2 overflow-hidden rounded-full bg-zinc-800'>
          <div
            className='bar-shine h-full rounded-full bg-cyan-500'
            style={{ width: `${earnedPercent}%` }}
          />
        </div>
      </div>

      {zone === "claim" && pending && waiting !== null && (
        <div className='flex min-w-0 flex-col gap-3 sm:min-w-[18rem] sm:max-w-sm'>
          <p className='flex items-center gap-2 text-sm font-bold text-zinc-100'>
            <Gift
              size={16}
              strokeWidth={2.5}
              className='shrink-0 text-amber-400'
            />
            {waiting === 1
              ? t("panel.rewards.toCollectOne")
              : t("panel.rewards.toCollect", { count: waiting })}
          </p>

          <RewardSummary reward={pending} size='md' />

          <Button
            size='lg'
            onClick={onClaimAll}
            loading={isClaiming}
            className='w-full px-6 sm:w-fit'>
            {!isClaiming && <PackageOpen />}
            {isClaiming
              ? t("panel.rewards.claiming")
              : t("panel.rewards.claimAll")}
          </Button>

          {readyCount > 0 && (
            <p className='text-[0.6875rem] text-zinc-500'>
              {t("panel.rewards.moreAfterSession", { count: readyCount })}
            </p>
          )}
        </div>
      )}

      {zone === "collected" && collected && (
        <div className='flex min-w-0 flex-col gap-3 sm:min-w-[18rem] sm:max-w-sm'>
          <p className='flex items-center gap-2 text-sm font-bold text-emerald-400'>
            <Check size={16} strokeWidth={2.5} className='shrink-0' />
            {collected.count === 1
              ? t("panel.rewards.collectedOne")
              : t("panel.rewards.collectedCount", { count: collected.count })}
          </p>

          <CollectedFigures reward={collected.reward} />

          {caseTokens > 0 && <CasesInHand count={caseTokens} openCase />}
        </div>
      )}

      {zone === "cases" && <CasesInHand count={caseTokens} />}
    </div>
  );
};
