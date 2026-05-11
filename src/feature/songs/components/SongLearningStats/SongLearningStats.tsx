import type { Song } from "feature/songs/types/songs.type";
import { calculateSkillPower } from "feature/songs/utils/difficulty.utils";
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
    userSongs.wantToLearn.length +
    userSongs.learning.length +
    userSongs.learned.length;

  const learnedPercentage = totalSongs
    ? (userSongs.learned.length / totalSongs) * 100
    : 0;

  const skillPower = calculateSkillPower(userSongs.learned);
  const playerTier = skillPower > 0 ? getSongTier(skillPower) : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Total Songs */}
      <div className="rounded-xl p-4 text-card-foreground flex flex-col border-0 bg-zinc-800/40 shadow-sm h-full backdrop-blur-sm">
         <div className="flex items-center gap-2 mb-6">
            <Music2 className="h-4 w-4 text-zinc-500" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t("total_songs")}</span>
         </div>
         <div className="mt-auto">
            <div className="flex items-baseline gap-2">
               <h3 className="text-3xl font-black text-white">{totalSongs}</h3>
               <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-tight">{t("songs_in_your_library", "in library")}</span>
            </div>
         </div>
      </div>

      {/* Completion Rate */}
      <div className="rounded-xl p-4 text-card-foreground flex flex-col border-0 bg-zinc-800/40 shadow-sm h-full backdrop-blur-sm">
         <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
               <Trophy className="h-4 w-4 text-zinc-500" />
               <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t("completion_rate")}</span>
            </div>
            <span className="text-[10px] font-bold text-zinc-500 tabular-nums">{userSongs.learned.length} / {totalSongs}</span>
         </div>
         <div className="mt-auto space-y-2.5">
             <h3 className="text-3xl font-black text-white">{learnedPercentage.toFixed(0)}%</h3>
             <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900/50 border border-white/5">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                    style={{ width: `${learnedPercentage}%` }}
                />
             </div>
         </div>
      </div>

      {/* Player Tier */}
      <div className="rounded-xl p-4 text-card-foreground flex flex-col border-0 bg-zinc-800/40 shadow-sm h-full backdrop-blur-sm">
         <div className="flex items-center gap-2 mb-6">
            <Star className="h-4 w-4 text-zinc-500" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t("your_skill_tier", "Skill Tier")}</span>
         </div>
         
         <div className="mt-auto">
            {playerTier ? (
               <div className="flex items-center gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 text-2xl font-black shadow-lg"
                    style={{ color: playerTier.color, backgroundColor: 'rgba(10,10,10,0.9)', borderColor: `${playerTier.color}40` }}
                  >
                    {playerTier.tier}
                  </div>
                  <div className="flex flex-col">
                     <span className="text-lg font-black text-white/90 uppercase tracking-tighter leading-none">Tier</span>
                     <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-1">
                        Power Score: <span className="text-zinc-300">{skillPower.toFixed(1)}</span>
                     </span>
                  </div>
               </div>
            ) : (
               <div className="flex flex-col">
                  <h3 className="text-2xl font-black text-zinc-500 uppercase">Unrated</h3>
                  <p className="text-[10px] font-medium text-zinc-600 mt-1 leading-snug">
                     Master more songs to evaluate your level.
                  </p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};
