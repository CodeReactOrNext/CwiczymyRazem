import { cn } from "assets/lib/utils";
import { RewardSummary } from "components/Rewards/RewardSummary";
import { getRarityColor } from "feature/arsenal/components/RarityBadge";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { useClaimRoadmapReward, useRewardLedger } from "hooks/useRewardLedger";
import { Check, Lock } from "lucide-react";

import {
  getRoadmapReward,
  roadmapRewardId,
} from "../../../data/roadmapRewards";

interface RoadmapFinishCardProps {
  roadmapId: string;
  done: number;
  total: number;
}

/**
 * The finish line of a curated roadmap.
 *
 * Replaces the plain "🏆 Finish" plate that used to close the map, and only for
 * the seven authored roadmaps: a roadmap a player generated for themselves is
 * theirs to edit, so it keeps the plain plate and pays nothing. `getRoadmapReward`
 * returning null is what draws that line — the card simply does not render.
 *
 * Built around the instrument, like the journey's finish: these are the longest
 * commitments in the app — upwards of two hundred practice sessions — and the
 * guitar waiting at the end is the reason anybody starts one.
 */
export const RoadmapFinishCard = ({
  roadmapId,
  done,
  total,
}: RoadmapFinishCardProps) => {
  const reward = getRoadmapReward(roadmapId);
  const { data: ledger } = useRewardLedger();
  const { mutate: claim, isPending } = useClaimRoadmapReward();

  if (!reward?.guitar || total === 0) return null;

  const { payout, guitar } = reward;
  const isClaimed =
    ledger?.roadmaps.claimed.includes(roadmapRewardId(roadmapId)) ?? false;
  const isComplete = done >= total;
  const canClaim = isComplete && !isClaimed;
  const rarityColor = getRarityColor(guitar.rarity);

  return (
    <div
      className={cn(
        "relative flex w-full max-w-sm flex-col items-center gap-6 overflow-hidden rounded-lg px-8 py-8 text-center",
        canClaim
          ? "bg-emerald-500/10"
          : isClaimed
            ? "bg-zinc-800/40"
            : "bg-zinc-900/50",
      )}>
      {/* The rarity's colour behind the instrument, so a Legendary reads as one
          before a single word is — and only once it is actually won. */}
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
            "h-32 w-32 object-contain",
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
          onClick={() => claim(roadmapId)}
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
