import { cn } from "assets/lib/utils";
import { RewardSummary } from "components/Rewards/RewardSummary";
import { getRarityColor } from "feature/arsenal/components/RarityBadge";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { useClaimJourneyReward, useRewardLedger } from "hooks/useRewardLedger";
import { Check, Lock } from "lucide-react";

import { getJourneyReward, journeyRewardId } from "../../data/journeyRewards";

interface JourneyFinishCardProps {
  moduleId: string;
  done: number;
  total: number;
}

/**
 * The finish line of a roadmap.
 *
 * The guitar is the reward, and the card is built around it: the instrument
 * sits on top at a size nothing else on the path competes with, and the Fame
 * and parts go underneath it as a footnote. A roadmap is a course somebody
 * works through for weeks, and "here is the guitar you get" is a better reason
 * to keep going than any number.
 *
 * Shown from the first visit, greyed and locked. Knowing *which* Legendary is
 * waiting is the whole point — a mystery prize motivates nobody, and this model
 * is fixed for the module, so it can be named up front.
 */
export const JourneyFinishCard = ({
  moduleId,
  done,
  total,
}: JourneyFinishCardProps) => {
  const reward = getJourneyReward(moduleId);
  const { data: ledger } = useRewardLedger();
  const { mutate: claim, isPending } = useClaimJourneyReward();

  if (!reward?.guitar || total === 0) return null;

  const { payout, guitar } = reward;
  const isClaimed =
    ledger?.journeys.claimed.includes(journeyRewardId(moduleId)) ?? false;
  const isComplete = done >= total;
  const canClaim = isComplete && !isClaimed;
  const rarityColor = getRarityColor(guitar.rarity);

  return (
    <div
      className={cn(
        "relative z-10 flex w-full max-w-sm flex-col items-center gap-6 overflow-hidden rounded-lg px-8 py-8 text-center",
        canClaim
          ? "bg-emerald-500/10"
          : isClaimed
            ? "bg-zinc-800/40"
            : "bg-zinc-900/50",
      )}>
      {/* The rarity's own colour behind the instrument, so a Legendary reads as
          one before a single word is. Only once it is actually won — a locked
          trophy should look like something still out of reach. Static: the
          card sits at the end of a path the player scrolls to read, and a
          breathing glow under it pulled the eye off everything above. */}
      {canClaim && (
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 opacity-50'
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${rarityColor}40, transparent 70%)`,
          }}
        />
      )}

      <div className='relative flex flex-col items-center gap-3'>
        <img
          src={getRankBadgeSrc(guitar.imageId, "medium")}
          alt={`${guitar.brand} ${guitar.name}`}
          className={cn(
            "h-32 w-32 object-contain transition-[filter]",
            !canClaim && !isClaimed && "opacity-40 grayscale",
          )}
          draggable={false}
        />

        <div>
          <span
            className='text-[0.6875rem] font-bold tracking-wide'
            style={{ color: rarityColor }}>
            {guitar.rarity}
          </span>
          <p className='font-display text-lg font-black leading-tight text-zinc-100'>
            {guitar.brand} {guitar.name}
          </p>
          <p className='mt-1.5 text-xs text-zinc-400'>
            {isClaimed
              ? "In your Arsenal, with a serial nobody else has."
              : canClaim
                ? "Roadmap complete — the guitar is yours."
                : `${total - done} of ${total} steps left to earn it.`}
          </p>
        </div>
      </div>

      {/* Everything else the finish pays, kept deliberately under the guitar. */}
      <RewardSummary
        reward={payout}
        size='lg'
        muted={!canClaim}
        className='relative items-start text-left'
      />

      {canClaim ? (
        <button
          onClick={() => claim(moduleId)}
          disabled={isPending}
          className={cn(
            "relative rounded-lg bg-zinc-100 px-6 py-2.5 text-xs font-bold capitalize tracking-wide text-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-white",
            isPending && "cursor-wait opacity-70",
          )}>
          {isPending ? "Collecting..." : "Collect the guitar"}
        </button>
      ) : (
        <span
          className={cn(
            "relative flex items-center gap-2 text-xs font-bold",
            isClaimed ? "text-emerald-400" : "text-zinc-600",
          )}>
          {isClaimed ? (
            <>
              <Check size={14} strokeWidth={3} />
              Collected
            </>
          ) : (
            <>
              <Lock size={14} strokeWidth={2.5} />
              {done}/{total} steps
            </>
          )}
        </span>
      )}
    </div>
  );
};
