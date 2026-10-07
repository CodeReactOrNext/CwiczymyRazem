import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import {
  FameIcon,
  PointsIcon,
} from "feature/challenges/components/RewardIcons";
import type {
  Challenge,
  ChallengeSubmission,
} from "feature/challenges/types/challenge.types";
import {
  FAME_CLEAR_BONUS,
  FAME_PER_SUBMISSION,
  POINTS_PER_SUBMISSION,
} from "feature/challenges/types/challenge.types";
import {
  challengeMonthLabel,
  daysLeftInChallenge,
  isChallengeLive,
} from "feature/challenges/utils/challengeMonth";
import {
  countParticipants,
  getClearedSongIds,
} from "feature/challenges/utils/challengeProgress";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { Swords, Trophy } from "lucide-react";
import { useMemo } from "react";

/** Shared with the section banners so every tab wears the same header. */
export const CHALLENGE_HERO_CLASS = "w-full !rounded-none !shadow-none";

interface ChallengeHeroProps {
  challenge: Challenge;
  submissions: ChallengeSubmission[];
  currentUserId: string | null;
}

const RewardChip = ({
  icon,
  amount,
  label,
  accent = false,
}: {
  icon: React.ReactNode;
  amount: number;
  label: string;
  accent?: boolean;
}) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
      accent
        ? "bg-amber-400/10 text-amber-200/80"
        : "bg-white/[0.04] text-zinc-400"
    }`}>
    {icon}
    <span className={`font-bold ${accent ? "text-amber-300" : "text-white"}`}>
      +{amount}
    </span>
    {label}
  </span>
);

/**
 * The board's header, wearing the same banner every other section of the app
 * uses. Everything about the month that isn't a song lives here — the clock,
 * what a run pays, how far you've got — so the content below is just the road.
 */
export const ChallengeHero = ({
  challenge,
  submissions,
  currentUserId,
}: ChallengeHeroProps) => {
  const { t } = useTranslation("challenges");
  const intlLocale = useIntlLocale();
  const isLive = isChallengeLive(challenge.id);
  const daysLeft = daysLeftInChallenge(challenge.id);
  const songs = challenge.songs;

  const clearedSongIds = useMemo(
    () => getClearedSongIds(submissions, currentUserId),
    [submissions, currentUserId],
  );
  const participants = useMemo(
    () => countParticipants(submissions),
    [submissions],
  );

  const clearedCount = songs.filter((s) => clearedSongIds.has(s.songId)).length;
  const progress = songs.length ? (clearedCount / songs.length) * 100 : 0;

  return (
    <HeroBanner
      title={challengeMonthLabel(challenge.id, intlLocale)}
      subtitle={
        isLive
          ? t("hero.live_subtitle", { count: songs.length })
          : t("hero.closed_subtitle")
      }
      backgroundContent={<HeroPattern />}
      className={CHALLENGE_HERO_CLASS}
      leftContentClassName='mt-4'
      eyebrowContent={
        <p className='flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold'>
          <span className='flex items-center gap-1.5 text-amber-300'>
            <Swords className='h-3.5 w-3.5' />
            {t("view.monthly")}
          </span>
          <span className='h-1 w-1 rounded-full bg-zinc-600' />
          <span className='font-medium text-zinc-500'>
            {isLive
              ? daysLeft === 0
                ? t("hero.closes_today")
                : daysLeft === 1
                  ? t("hero.day_left", { count: daysLeft })
                  : t("hero.days_left", { count: daysLeft })
              : t("hero.closed")}
          </span>
        </p>
      }
      leftContent={
        isLive ? (
          <div className='flex flex-wrap gap-2'>
            <RewardChip
              icon={<PointsIcon />}
              amount={POINTS_PER_SUBMISSION}
              label={t("hero.points_per_run")}
            />
            <RewardChip
              icon={<FameIcon />}
              amount={FAME_PER_SUBMISSION}
              label={t("hero.fame_per_run")}
            />
            <RewardChip
              icon={<FameIcon />}
              amount={FAME_CLEAR_BONUS}
              label={t("hero.fame_full_board")}
              accent
            />
          </div>
        ) : undefined
      }
      rightContent={
        <div className='flex flex-col items-start gap-2 md:items-end'>
          {songs.length > 0 && currentUserId && (
            <>
              <span className='text-xs text-zinc-400'>{t("hero.your_runs")}</span>
              <span className='text-4xl font-black leading-none text-cyan-300'>
                {clearedCount}
                <span className='text-xl text-zinc-600'>/{songs.length}</span>
              </span>
              <div className='h-1 w-28 overflow-hidden rounded-full bg-white/10'>
                <div
                  className='h-full rounded-full bg-green-500 transition-all duration-700'
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          )}
          <p className='flex items-center gap-1.5 text-xs text-zinc-500'>
            <span>
              {participants === 1 ? t("hero.player", { count: participants }) : t("hero.players", { count: participants })}
            </span>
            {(challenge.finisherCount ?? 0) > 0 && (
              <>
                <span className='h-1 w-1 rounded-full bg-zinc-700' />
                <span className='flex items-center gap-1 text-amber-300'>
                  <Trophy className='h-3 w-3' />
                  {t("hero.cleared", { count: challenge.finisherCount })}
                </span>
              </>
            )}
          </p>
        </div>
      }
    />
  );
};
