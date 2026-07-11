import type { Song } from "feature/songs/types/songs.type";
import { getGatedSkillPower } from "feature/songs/utils/difficulty.utils";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { useTranslation } from "hooks/useTranslation";
import { Music2, Star, Trophy } from "lucide-react";

import { TierBadge } from "../SongsGrid/TierBadge";

interface SongLearningStatsProps {
  userSongs: {
    wantToLearn: Song[];
    learning: Song[];
    learned: Song[];
  };
}

export const SongLearningStats = ({ userSongs }: SongLearningStatsProps) => {
  const { t } = useTranslation("songs");

  const totalSongs =
    (userSongs?.wantToLearn?.length || 0) +
    (userSongs?.learning?.length || 0) +
    (userSongs?.learned?.length || 0);

  const learnedPercentage = totalSongs
    ? ((userSongs?.learned?.length || 0) / totalSongs) * 100
    : 0;

  const skillPower = getGatedSkillPower(userSongs?.learned || []);
  const playerTier = skillPower > 0 ? getSongTier(skillPower) : null;

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {/* Total Songs */}
      <div className='flex h-full flex-col rounded-lg bg-zinc-900/40 p-4 text-card-foreground shadow-sm backdrop-blur-sm'>
        <div className='mb-6 flex items-center gap-3'>
          <div className='flex h-8 w-8 items-center justify-center rounded-[4px] border border-white/5 border-l-zinc-500/20 border-t-zinc-500/40 bg-gradient-to-br from-zinc-500/20 to-zinc-500/5 text-zinc-400 shadow-lg'>
            <Music2 className='h-4 w-4' />
          </div>
          <span className='text-[10px] font-bold text-zinc-400'>
            {t("total_songs")}
          </span>
        </div>
        <div className='mt-auto'>
          <div className='flex items-baseline gap-2'>
            <h3 className='text-3xl font-black text-white'>{totalSongs}</h3>
            <span className='text-[11px] font-bold text-zinc-500'>
              {t("songs_in_your_library", "in library")}
            </span>
          </div>
        </div>
      </div>

      {/* Completion Rate */}
      <div className='flex h-full flex-col rounded-lg bg-zinc-900/40 p-4 text-card-foreground shadow-sm backdrop-blur-sm'>
        <div className='mb-6 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex h-8 w-8 items-center justify-center rounded-[4px] border border-white/5 border-l-emerald-500/20 border-t-emerald-500/40 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-400 shadow-lg'>
              <Trophy className='h-4 w-4' />
            </div>
            <span className='text-[10px] font-bold text-zinc-400'>
              {t("completion_rate")}
            </span>
          </div>
          <span className='text-[10px] font-bold tabular-nums text-zinc-500'>
            {userSongs?.learned?.length || 0} / {totalSongs}
          </span>
        </div>
        <div className='mt-auto space-y-2.5'>
          <h3 className='text-3xl font-black text-white'>
            {learnedPercentage.toFixed(0)}%
          </h3>
          <div className='h-1.5 w-full overflow-hidden rounded-full bg-zinc-900/50'>
            <div
              className='h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
              style={{ width: `${learnedPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Player Tier */}
      <div className='flex h-full flex-col rounded-lg bg-zinc-900/40 p-4 text-card-foreground shadow-sm backdrop-blur-sm'>
        <div className='mb-6 flex items-center gap-3'>
          <div className='flex h-8 w-8 items-center justify-center rounded-[4px] border border-white/5 border-l-amber-500/20 border-t-amber-500/40 bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-400 shadow-lg'>
            <Star className='h-4 w-4' />
          </div>
          <span className='text-[10px] font-bold text-zinc-400'>
            {t("your_skill_tier", "Skill tier")}
          </span>
        </div>

        <div className='mt-auto'>
          {playerTier ? (
            <div className='flex items-center gap-4'>
              <div
                className='flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-2xl font-black shadow-lg'
                style={{
                  color: playerTier.color,
                  backgroundColor: "rgba(10,10,10,0.9)",
                }}>
                {playerTier.tier}
              </div>
              <div className='flex flex-col'>
                <span className='text-lg font-black leading-none text-white/90'>
                  Tier
                </span>
                <span className='mt-1 text-[10px] font-bold text-zinc-500'>
                  Power score:{" "}
                  <span className='text-zinc-300'>{skillPower.toFixed(1)}</span>
                </span>
              </div>
            </div>
          ) : (
            <div className='flex flex-col'>
              <h3 className='text-2xl font-black text-zinc-500'>Unrated</h3>
              <p className='mt-1 text-[10px] font-medium leading-snug text-zinc-600'>
                Master more songs to evaluate your level.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
