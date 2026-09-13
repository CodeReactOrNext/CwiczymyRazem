import { Card } from "assets/components/ui/card";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { milestoneWidgetTier } from "feature/dashboard/data/milestoneWidgets";
import { useClaimMilestone } from "feature/dashboard/hooks/useClaimMilestone";
import { useMilestoneProgress } from "feature/dashboard/hooks/useMilestoneProgress";
import type { MilestoneWidgetId } from "feature/dashboard/types/dashboard.types";
import {
  milestoneChartKind,
  milestoneDayRule,
} from "feature/dashboard/utils/milestoneWeek";
import Link from "next/link";

import { MilestoneChart } from "./MilestoneChart";
import { isClaimableNode, isLockedNode, MilestoneNode } from "./MilestoneNode";

/**
 * One weekly goal: a header line carrying the tier's disc, what the goal asks
 * for and the one thing to do about it right now — claim the Fame, unlock the
 * tier, or keep practising — over the week drawn as seven bars.
 *
 * The header stays a single line whatever the card's width, so three of these
 * on Home read as three glances rather than three panels. The ring on the disc
 * doubles as the progress bar the line would otherwise need.
 */
export const MilestoneCard = ({
  widgetId,
}: {
  widgetId: MilestoneWidgetId;
}) => {
  const tier = milestoneWidgetTier(widgetId);
  const { statuses, days, weekKey, isLoading, isError } =
    useMilestoneProgress();
  const claim = useClaimMilestone();

  // The layout only ever holds ids the catalog accepts, so a missing tier means
  // the table changed under a saved layout — nothing to draw.
  if (!tier) return null;

  const status = statuses?.find((entry) => entry.id === tier.id) ?? null;

  if (isError) {
    return (
      <Card className='flex h-full items-center gap-4 p-4 sm:p-5'>
        <div className='min-w-0'>
          <h3 className='text-sm font-semibold text-zinc-100'>{tier.name}</h3>
          <p className='mt-0.5 text-xs text-zinc-400'>
            Couldn&apos;t load this week&apos;s progress.
          </p>
        </div>
      </Card>
    );
  }

  if (isLoading || !status) {
    return (
      <Card className='flex h-full items-center gap-4 p-4 sm:p-5'>
        <Skeleton className='h-14 w-14 shrink-0 rounded-full' />
        <div className='min-w-0 flex-1 space-y-2'>
          <Skeleton className='h-4 w-24 rounded' />
          <Skeleton className='h-3 w-44 rounded' />
        </div>
      </Card>
    );
  }

  const locked = isLockedNode(status);
  const canClaim = isClaimableNode(status);
  // The one being worked towards: owned, open and not finished yet.
  const isCurrent = !status.met && !locked;

  return (
    <Card className='flex h-full flex-col gap-4 p-4 sm:p-5'>
      <div className='flex flex-wrap items-center gap-x-4 gap-y-3'>
        <MilestoneNode status={status} isCurrent={isCurrent} />

        <div className='min-w-0 flex-1'>
          <div className='flex items-baseline gap-2'>
            <h3 className='truncate text-sm font-semibold text-zinc-100'>
              {status.name}
            </h3>
            {!locked && (
              <span className='shrink-0 text-xs font-semibold tabular-nums text-zinc-500'>
                {status.progress.value}/{status.progress.max}
              </span>
            )}
          </div>
          <p className='mt-0.5 text-xs leading-relaxed text-zinc-400'>
            {status.req}
          </p>
        </div>

        {/* Branch on the level gate rather than on the padlock: the disc wears
          one for an unbought tier too, but that one is a shop, not a wall. */}
        {status.lockedAtLvl !== null ? (
          <span className='shrink-0 text-xs text-zinc-500'>
            Opens at level {status.lockedAtLvl}
          </span>
        ) : !status.owned ? (
          <Link
            href='/summary'
            className='shrink-0 rounded-lg bg-zinc-900/60 px-3 py-2 text-xs font-semibold text-zinc-200 transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 hover:bg-zinc-900'>
            Unlock · {status.cost} Fame
          </Link>
        ) : canClaim ? (
          <button
            type='button'
            disabled={claim.isPending}
            onClick={() =>
              claim.mutate({
                id: status.id,
                name: status.name,
                reward: status.reward,
                weekKey,
              })
            }
            className={cn(
              "shrink-0 rounded-lg bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-400 transition-background",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 hover:bg-amber-500/20",
              "disabled:pointer-events-none disabled:opacity-50",
            )}>
            {claim.isPending ? "Claiming…" : `Claim +${status.reward}`}
          </button>
        ) : status.claimed ? (
          <span className='shrink-0 text-xs text-zinc-500'>Claimed</span>
        ) : (
          <span className='shrink-0 text-xs font-semibold text-amber-400'>
            +{status.reward} Fame
          </span>
        )}
      </div>

      {/* The week itself, drawn the way this tier's own page draws it — bars
          against a goal line, a streak of tiles, or the four categories.
          Dropped while the tier is shut: a chart of a goal you cannot claim yet
          is decoration, and the padlock is the message. */}
      {!locked && days && (
        <MilestoneChart
          kind={milestoneChartKind(tier)}
          days={days}
          rule={milestoneDayRule(tier)}
          color={status.color}
        />
      )}
    </Card>
  );
};
