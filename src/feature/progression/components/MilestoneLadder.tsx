import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { RewardSummary } from "components/Rewards/RewardSummary";
import { IMG_RANKS_NUMBER } from "constants/gameSettings";
import { getRarityColor } from "feature/arsenal/components/RarityBadge";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { FEATURE_UNLOCKS } from "feature/levelGate/data/featureUnlocks";
import { pointsToReachLvl } from "feature/levelGate/utils/levelGate.utils";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { useClaimLevelReward, useRewardLedger } from "hooks/useRewardLedger";
import { Check, Lock, Wrench } from "lucide-react";
import { useAppSelector } from "store/hooks";

import type { LevelMilestone, MilestoneUnlock } from "../data/levelMilestones";
import { LEVEL_MILESTONES, levelRewardId } from "../data/levelMilestones";
import type { LevelReward } from "../utils/levelRewards";
import { rollLevelReward } from "../utils/levelRewards";

/** What one unlock reads as, and the colour it carries. */
const unlockLabel = (
  unlock: MilestoneUnlock,
): { text: string; color?: string } =>
  unlock.kind === "rarity"
    ? {
        text: `${unlock.rarity} gear`,
        color: getRarityColor(unlock.rarity),
      }
    : { text: FEATURE_UNLOCKS[unlock.feature].name };

interface RungProps {
  milestone: LevelMilestone;
  reward: LevelReward | null;
  lvl: number;
  points: number;
  claimed: boolean;
  onClaim: (lvl: number) => void;
  isClaiming: boolean;
}

/**
 * One rung.
 *
 * Three states, and the row says which without a label: reached and paid,
 * reached and waiting to be collected, and still ahead. Separation is carried
 * by the background and the spacing rather than by a rule between rows — a
 * ladder drawn with lines reads as a table, and this is meant to read as a
 * climb.
 */
const Rung = ({
  milestone,
  reward,
  lvl,
  points,
  claimed,
  onClaim,
  isClaiming,
}: RungProps) => {
  const reached = lvl >= milestone.lvl;
  const canCollect = reached && reward !== null && !claimed;
  const toGo = pointsToReachLvl(points, milestone.lvl);

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:gap-6",
        canCollect
          ? "bg-amber-500/10"
          : reached
            ? "bg-zinc-800/40"
            : "bg-zinc-900/40",
      )}>
      <div className='flex items-center gap-4 sm:w-44 sm:shrink-0'>
        {milestone.lvl <= IMG_RANKS_NUMBER ? (
          <img
            src={getRankBadgeSrc(milestone.lvl)}
            alt=''
            className={cn(
              "h-12 w-12 shrink-0 object-contain",
              !reached && "opacity-30 grayscale",
            )}
          />
        ) : (
          <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-800/60 text-sm font-bold text-zinc-400'>
            {milestone.lvl}
          </div>
        )}
        <div className='min-w-0'>
          <p
            className={cn(
              "text-sm font-bold tracking-wide",
              reached ? "text-white" : "text-zinc-400",
            )}>
            Level {milestone.lvl}
          </p>
          {!reached && (
            <p className='text-xs tabular-nums text-zinc-500'>
              {toGo.toLocaleString()} points to go
            </p>
          )}
        </div>
      </div>

      <div className='min-w-0 flex-1 space-y-3'>
        {milestone.unlocks.length > 0 && (
          <div className='flex flex-wrap items-center gap-x-4 gap-y-1.5'>
            {milestone.unlocks.map((unlock) => {
              const { text, color } = unlockLabel(unlock);
              return (
                <span
                  key={text}
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-semibold",
                    !reached && "opacity-60",
                  )}
                  style={color ? { color } : undefined}>
                  {reached ? <Check size={14} /> : <Lock size={12} />}
                  <span className={color ? undefined : "text-zinc-200"}>
                    {text}
                  </span>
                </span>
              );
            })}
          </div>
        )}

        {reward && (
          <div className='flex flex-wrap items-center gap-x-4 gap-y-1.5'>
            <RewardSummary
              reward={{
                fame: 0,
                caseTokens: reward.caseTokens,
                parts: reward.parts,
              }}
              muted={!reached}
            />
            {reward.mods.map((mod) => (
              <span
                key={mod.featureId}
                className={cn(
                  "flex items-center gap-1.5 text-[0.6875rem] font-semibold text-purple-300",
                  !reached && "opacity-60",
                )}
                title={`${mod.label} — fits any ${mod.kind === "guitar" ? "guitar" : "pedal"} that can take it`}>
                <Wrench size={14} strokeWidth={2.5} className='shrink-0' />
                {mod.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className='sm:w-32 sm:shrink-0 sm:text-right'>
        {canCollect ? (
          <Button
            size='sm'
            disabled={isClaiming}
            onClick={() => onClaim(milestone.lvl)}
            className='w-full bg-amber-500 text-zinc-950 hover:bg-amber-400 sm:w-auto'>
            Collect
          </Button>
        ) : claimed ? (
          <span className='flex items-center gap-1.5 text-xs font-semibold text-emerald-400 sm:justify-end'>
            <Check size={14} /> Collected
          </span>
        ) : null}
      </div>
    </div>
  );
};

/**
 * Every rung of the level ladder, and what each one is worth.
 *
 * The whole ladder is shown at once, unreached rungs included. The point of the
 * screen is the climb ahead — a list that only showed what has already been
 * passed would be a receipt, and there is one of those on the profile already.
 *
 * What a rung pays is printed before it is reached because the payout is a pure
 * function of the level (`rollLevelReward`), the same one the server re-derives
 * when it pays. Nobody is being shown a sample.
 */
export const MilestoneLadder = () => {
  const stats = useAppSelector(selectCurrentUserStats);
  const { data: ledger } = useRewardLedger();
  const claim = useClaimLevelReward();

  const lvl = stats?.lvl ?? 1;
  const points = stats?.points ?? 0;
  const claimed = ledger?.levels?.claimed ?? [];

  return (
    <section className='space-y-6'>
      <div className='space-y-1.5'>
        <h2 className='text-2xl font-bold text-white'>Progression</h2>
        <p className='max-w-2xl text-sm text-zinc-400'>
          Practice sets your level, and your level opens the rest of the game:
          which pages you can reach, and how rare a piece of gear you can put in
          your rig. Every rung pays out once, and nothing on it ever expires.
        </p>
      </div>

      <div className='space-y-3'>
        {LEVEL_MILESTONES.map((milestone) => (
          <Rung
            key={milestone.lvl}
            milestone={milestone}
            reward={rollLevelReward(milestone)}
            lvl={lvl}
            points={points}
            claimed={claimed.includes(levelRewardId(milestone.lvl))}
            onClaim={claim.mutate}
            isClaiming={claim.isPending}
          />
        ))}
      </div>
    </section>
  );
};
