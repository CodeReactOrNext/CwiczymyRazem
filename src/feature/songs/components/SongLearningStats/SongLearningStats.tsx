import { TierScale } from "feature/songs/components/SongLearningStats/TierScale";
import type { Song } from "feature/songs/types/songs.type";
import {
  getGatedSkillPower,
  getSongsUntilNextTier,
} from "feature/songs/utils/difficulty.utils";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";
import type { LucideIcon } from "lucide-react";
import { Music2, Star, Trophy } from "lucide-react";
import type { ReactNode } from "react";

interface SongLearningStatsProps {
  userSongs: {
    wantToLearn: Song[];
    learning: Song[];
    learned: Song[];
  };
}

/** Same anatomy as the profile's StatsField: grey icon inline with the label, then the number. */
const StatTile = ({
  Icon,
  label,
  aside,
  children,
}: {
  Icon: LucideIcon;
  label: string;
  aside?: ReactNode;
  children: ReactNode;
}) => (
  <div className='flex h-full flex-col gap-1.5 rounded-lg bg-zinc-800/40 p-5'>
    <div className='flex items-center justify-between gap-2'>
      <div className='flex items-center gap-2'>
        <Icon className='h-4 w-4 text-zinc-500' />
        <span className='text-xs font-medium text-zinc-400'>{label}</span>
      </div>
      {aside}
    </div>
    {children}
  </div>
);

export const SongLearningStats = ({ userSongs }: SongLearningStatsProps) => {
  const { t } = useTranslation("songs");

  const learnedCount = userSongs?.learned?.length || 0;
  const totalSongs =
    (userSongs?.wantToLearn?.length || 0) +
    (userSongs?.learning?.length || 0) +
    learnedCount;

  const learnedPercentage = totalSongs ? (learnedCount / totalSongs) * 100 : 0;

  const skillPower = getGatedSkillPower(userSongs?.learned || []);
  const playerTier = skillPower > 0 ? getSongTier(skillPower) : null;
  const nextTierProgress = getSongsUntilNextTier(userSongs?.learned || []);

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      <StatTile Icon={Music2} label={t("total_songs")}>
        <p className='text-2xl font-bold tabular-nums text-white'>{totalSongs}</p>
        <p className='text-xs text-zinc-500'>
          {t("songs_in_your_library", "in library")}
        </p>
      </StatTile>

      <StatTile
        Icon={Trophy}
        label={t("completion_rate")}
        aside={
          <span className='text-xs tabular-nums text-zinc-500'>
            {learnedCount} / {totalSongs}
          </span>
        }>
        <p className='text-2xl font-bold tabular-nums text-white'>
          {learnedPercentage.toFixed(0)}%
        </p>
        <div className='mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-900/60'>
          <div
            className='h-full rounded-full bg-emerald-500'
            style={{ width: `${learnedPercentage}%` }}
          />
        </div>
      </StatTile>

      <StatTile
        Icon={Star}
        label={t("your_skill_tier", "Skill tier")}
        aside={
          playerTier && (
            <span className='text-xs text-zinc-500'>
              {t("power.score_label")}{" "}
              <span className='tabular-nums text-zinc-300'>
                {skillPower.toFixed(1)}
              </span>
            </span>
          )
        }>
        {playerTier ? (
          <p className='flex items-baseline gap-2'>
            <span
              className='text-2xl font-bold'
              style={{ color: playerTier.color }}>
              {playerTier.tier}
            </span>
            <span className='text-sm font-medium text-zinc-300'>
              {t(playerTier.description)}
            </span>
          </p>
        ) : (
          <p className='text-2xl font-bold text-zinc-500'>
            {t("tier.unrated")}
          </p>
        )}

        <TierScale skillPower={skillPower} className='mt-3' />

        {nextTierProgress ? (
          <p className='mt-2 text-xs text-zinc-500'>
            {nextTierProgress.songsNeeded > 1
              ? t("power.more_songs", { count: nextTierProgress.songsNeeded })
              : t("power.more_song_one")}{" "}
            <Interpolate
              text={t("power.as_hard_as")}
              values={{
                tier: (
                  <span
                    className='font-bold'
                    style={{ color: getSongTier(nextTierProgress.nextTier).color }}>
                    {nextTierProgress.nextTier}
                  </span>
                ),
              }}
            />
          </p>
        ) : (
          !playerTier && (
            <p className='mt-2 text-xs text-zinc-500'>
              {t("power.master_more")}
            </p>
          )
        )}
      </StatTile>
    </div>
  );
};
