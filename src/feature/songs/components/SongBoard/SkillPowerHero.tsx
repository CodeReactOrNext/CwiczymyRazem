import { cn } from "assets/lib/utils";
import type { NextTierProgress } from "feature/songs/utils/difficulty.utils";
import { MIN_LEARNED_SONGS_FOR_TIER } from "feature/songs/utils/difficulty.utils";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { Clock, Music2, Star, TrendingUp } from "lucide-react";

interface SkillPowerHeroProps {
  skillPower: number;
  playerTier: any;
  learnedCount: number;
  totalCount: number;
  totalPracticeMs?: number;
  nextTierProgress?: NextTierProgress | null;
  className?: string;
}

const formatPracticeTime = (ms: number) => {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const TierUnlockTrack = ({
  learnedCount,
  className,
}: {
  learnedCount: number;
  className?: string;
}) => {
  const remaining = Math.max(0, MIN_LEARNED_SONGS_FOR_TIER - learnedCount);
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className='flex w-full items-center gap-1'>
        {Array.from({ length: MIN_LEARNED_SONGS_FOR_TIER }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              index < learnedCount ? "bg-cyan-400" : "bg-zinc-800",
            )}
          />
        ))}
      </div>
      <span className='text-center text-xs font-bold leading-tight text-zinc-300'>
        {learnedCount}/{MIN_LEARNED_SONGS_FOR_TIER} songs learned
      </span>
      <span className='text-center text-[11px] leading-tight text-zinc-500'>
        Master {remaining} more song{remaining === 1 ? "" : "s"} to reveal your
        tier
      </span>
    </div>
  );
};

const NextTierHint = ({
  nextTierProgress,
  className,
}: {
  nextTierProgress: NextTierProgress;
  className?: string;
}) => {
  const nextTier = getSongTier(nextTierProgress.nextTier);
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-1.5 rounded-lg bg-white/5 px-3 py-2 text-center",
        className,
      )}>
      <span className='text-xs font-bold text-zinc-200'>
        {nextTierProgress.songsNeeded} more song
        {nextTierProgress.songsNeeded > 1 ? "s" : ""}
      </span>
      <span className='text-[11px] leading-tight text-zinc-500'>
        as hard as{" "}
        <span className='font-black' style={{ color: nextTier.color }}>
          {nextTier.label}
        </span>{" "}
        to level up
      </span>
    </div>
  );
};

const TierBadge = ({
  playerTier,
  className,
}: {
  playerTier: any;
  className?: string;
}) => (
  <div
    className={cn(
      "flex items-center justify-center rounded-lg font-black shadow-2xl",
      className,
    )}
    style={{
      color: playerTier.color,
      backgroundColor: "rgba(10,10,10,0.8)",
      boxShadow: `0 0 40px ${playerTier.color}15`,
    }}>
    {playerTier.tier}
  </div>
);

export const SkillPowerHero = ({
  skillPower,
  playerTier,
  learnedCount,
  totalCount,
  totalPracticeMs = 0,
  nextTierProgress,
  className,
}: SkillPowerHeroProps) => {
  const isTierLocked = learnedCount < MIN_LEARNED_SONGS_FOR_TIER;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-zinc-900/40 p-4 backdrop-blur-xl sm:p-8",
        className,
      )}>
      {/* Background Decorative Elements */}
      <div className='absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-[80px]' />
      <div className='absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald-500/5 blur-[80px]' />

      <div className='relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8'>
        {/* Header + score. Below md the tier badge rides along on the right so
            the two tallest blocks share one row instead of stacking. */}
        <div className='flex items-center justify-between gap-4 md:block'>
          <div className='space-y-4 sm:space-y-6'>
            <div className='flex items-center gap-3'>
              <div className='flex h-9 w-9 items-center justify-center rounded-[4px] bg-white/5 text-zinc-300 shadow-lg sm:h-10 sm:w-10'>
                <TrendingUp size={18} />
              </div>
              <div>
                <h2 className='text-sm font-bold leading-none text-zinc-500'>
                  Your skill power
                </h2>
                <p className='mt-1 text-[11px] leading-tight text-zinc-600 sm:text-xs'>
                  Based on mastered songs difficulty
                </p>
              </div>
            </div>

            <div className='flex items-baseline gap-3 sm:gap-4'>
              <span className='text-5xl font-black tracking-tighter text-white sm:text-7xl'>
                {skillPower.toFixed(1)}
              </span>
              <span className='text-base font-bold leading-none text-white sm:text-xl'>
                Power score
              </span>
            </div>
          </div>

          <div className='flex shrink-0 flex-col items-center gap-1.5 md:hidden'>
            <TierBadge playerTier={playerTier} className='h-16 w-16 text-3xl' />
            <span className='text-[10px] font-bold tracking-wider text-zinc-500'>
              Current tier
            </span>
          </div>
        </div>

        <div className='flex flex-col gap-6 sm:flex-row sm:items-center'>
          <div className='grid grid-cols-3 gap-3 rounded-lg bg-white/5 p-3 sm:gap-8 sm:bg-transparent sm:p-0'>
            <div className='space-y-1.5 sm:space-y-2.5'>
              <p className='text-[10px] font-bold tracking-wider text-zinc-500'>
                Mastered
              </p>
              <div className='flex items-center gap-2'>
                <Music2 size={14} className='text-zinc-500' />
                <span className='text-lg font-bold text-white'>
                  {learnedCount}
                </span>
              </div>
            </div>
            <div className='space-y-1.5 sm:space-y-2.5'>
              <p className='text-[10px] font-bold tracking-wider text-zinc-500'>
                Total
              </p>
              <div className='flex items-center gap-2'>
                <Star size={14} className='text-zinc-500' />
                <span className='text-lg font-bold text-white'>
                  {totalCount}
                </span>
              </div>
            </div>
            <div className='space-y-1.5 sm:space-y-2.5'>
              <p className='text-[10px] font-bold tracking-wider text-zinc-500'>
                Time spent
              </p>
              <div className='flex items-center gap-2'>
                <Clock size={14} className='text-zinc-500' />
                <span className='whitespace-nowrap text-lg font-bold text-white'>
                  {formatPracticeTime(totalPracticeMs)}
                </span>
              </div>
            </div>
          </div>

          <div className='hidden h-16 w-px bg-white/5 md:block' />

          <div className='hidden flex-col items-center md:flex'>
            <TierBadge
              playerTier={playerTier}
              className='mb-3 h-24 w-24 text-4xl'
            />
            {isTierLocked ? (
              <TierUnlockTrack learnedCount={learnedCount} className='w-28' />
            ) : (
              <div className='flex flex-col items-center gap-2'>
                <span className='text-xs font-bold tracking-wider text-zinc-500'>
                  Current tier
                </span>
                {nextTierProgress && (
                  <NextTierHint
                    nextTierProgress={nextTierProgress}
                    className='flex-col gap-1'
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Same footer, full width on phones instead of squeezed under the badge. */}
        <div className='md:hidden'>
          {isTierLocked ? (
            <TierUnlockTrack learnedCount={learnedCount} />
          ) : (
            nextTierProgress && (
              <NextTierHint nextTierProgress={nextTierProgress} />
            )
          )}
        </div>
      </div>
    </div>
  );
};
