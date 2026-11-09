import { cn } from "assets/lib/utils";
import { TierPick } from "feature/songs/components/SongsGrid/TierBadge";
import type { NextTierProgress } from "feature/songs/utils/difficulty.utils";
import { MIN_LEARNED_SONGS_FOR_TIER } from "feature/songs/utils/difficulty.utils";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";
import { ChevronDown, Clock, Star, TrendingUp } from "lucide-react";
import { useState } from "react";

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
  if (hours > 0) return `${hours}h ${minutes} min`;
  return `${minutes} min`;
};

const TierUnlockTrack = ({
  learnedCount,
  className,
}: {
  learnedCount: number;
  className?: string;
}) => {
  const { t } = useTranslation("songs");
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
        {t("power.songs_learned", {
          done: learnedCount,
          total: MIN_LEARNED_SONGS_FOR_TIER,
        })}
      </span>
      <span className='text-center text-[11px] leading-tight text-zinc-500'>
        {remaining === 1
          ? t("power.reveal_one")
          : t("power.reveal", { count: remaining })}
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
  const { t } = useTranslation("songs");
  const nextTier = getSongTier(nextTierProgress.nextTier);
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className='text-sm font-semibold text-zinc-200'>
        {nextTierProgress.songsNeeded > 1
          ? t("power.more_songs", { count: nextTierProgress.songsNeeded })
          : t("power.more_song_one")}
      </span>
      <span className='text-xs text-zinc-500'>
        <Interpolate
          text={t("power.as_hard_as")}
          values={{
            tier: (
              <span className='font-black' style={{ color: nextTier.color }}>
                {nextTier.label}
              </span>
            ),
          }}
        />
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
}) => <TierPick tier={getSongTier(playerTier.tier)} className={className} />;

export const SkillPowerHero = ({
  skillPower,
  playerTier,
  learnedCount,
  totalCount,
  totalPracticeMs = 0,
  nextTierProgress,
  className,
}: SkillPowerHeroProps) => {
  const { t } = useTranslation("songs");
  const isTierLocked = learnedCount < MIN_LEARNED_SONGS_FOR_TIER;
  // Phones: the hero folds to one row (pick + score) so the song list starts
  // above the fold; the stats and the next-tier hint open on a tap.
  const [isOpen, setIsOpen] = useState(false);

  // Nothing mastered yet: a 0.0 score would read as a rating, and the big card
  // pushes the song list (the actual next step) to the bottom of the screen.
  if (learnedCount === 0) {
    return (
      <div
        className={cn(
          "flex flex-col gap-4 rounded-lg bg-zinc-900/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6",
          className,
        )}>
        <div className='flex items-center gap-3'>
          <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] bg-white/5 text-zinc-400'>
            <TrendingUp size={18} />
          </div>
          <div>
            <h2 className='text-sm font-bold text-zinc-200'>
              {t("power.not_assessed")}
            </h2>
            <p className='mt-0.5 text-xs text-zinc-500'>
              {t("power.not_assessed_hint", { count: MIN_LEARNED_SONGS_FOR_TIER })}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-6 text-xs text-zinc-500'>
          <span className='flex items-center gap-1.5'>
            <Star size={14} />
            <span className='font-bold text-zinc-200'>{totalCount}</span>
            {totalCount === 1 ? t("power.on_board_one") : t("power.on_board")}
          </span>
          <span className='flex items-center gap-1.5'>
            <Clock size={14} />
            <span className='font-bold text-zinc-200'>
              {formatPracticeTime(totalPracticeMs)}
            </span>
            practised
          </span>
        </div>
      </div>
    );
  }

  const stats = [
    { label: t("power.mastered"), value: learnedCount },
    { label: t("power.total"), value: totalCount },
    { label: t("power.time_spent"), value: formatPracticeTime(totalPracticeMs) },
  ];

  // One row on desktop: the pick sits next to the score it belongs to, the
  // stats and the next-tier hint follow it, instead of three islands spread
  // across the full width.
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl bg-zinc-900/40 p-3 sm:gap-5 sm:rounded-lg sm:p-6 lg:flex-row lg:items-center lg:gap-10",
        className,
      )}>
      <button
        type='button'
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className='flex w-full items-center gap-4 text-left focus-visible:outline-none sm:pointer-events-none sm:w-auto sm:gap-5'>
        <TierBadge
          playerTier={playerTier}
          className='h-12 w-12 shrink-0 sm:h-20 sm:w-20'
        />
        <div className='min-w-0 flex-1'>
          <h2 className='text-sm font-medium text-zinc-400'>
            {t("power.title")}
          </h2>
          <p className='mt-1 text-3xl font-black leading-none tracking-tight text-white tabular-nums sm:mt-1.5 sm:text-5xl'>
            {skillPower.toFixed(1)}
          </p>
        </div>
        <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-zinc-400 sm:hidden'>
          <ChevronDown
            size={18}
            className={cn("transition-transform duration-fast", isOpen && "rotate-180")}
          />
        </span>
      </button>

      {/* Same rhythm as the score: label on top, value under it. */}
      <dl
        className={cn(
          "grid-cols-3 gap-4 rounded-lg bg-white/5 p-3 sm:grid sm:gap-10 lg:ml-auto lg:bg-transparent lg:p-0",
          isOpen ? "grid" : "hidden",
        )}>
        {stats.map(({ label, value }) => (
          <div key={label} className='min-w-0'>
            <dt className='text-sm font-medium text-zinc-400'>{label}</dt>
            <dd className='mt-1.5 whitespace-nowrap text-xl font-bold leading-none text-white tabular-nums sm:text-2xl'>
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {isTierLocked ? (
        <TierUnlockTrack
          learnedCount={learnedCount}
          className={cn("lg:w-40", !isOpen && "hidden sm:flex")}
        />
      ) : (
        nextTierProgress && (
          <NextTierHint
            nextTierProgress={nextTierProgress}
            className={cn("lg:w-52", !isOpen && "hidden sm:flex")}
          />
        )
      )}
    </div>
  );
};
