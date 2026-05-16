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
    (userSongs?.wantToLearn?.length || 0) +
    (userSongs?.learning?.length || 0) +
    (userSongs?.learned?.length || 0);

  const learnedPercentage = totalSongs
    ? ((userSongs?.learned?.length || 0) / totalSongs) * 100
    : 0;

  const skillPower = calculateSkillPower(userSongs?.learned || []);
  const playerTier = skillPower > 0 ? getSongTier(skillPower) : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Total Songs */}
      <div className="rounded-lg p-4 text-card-foreground flex flex-col bg-zinc-900/40 shadow-sm h-full backdrop-blur-sm">
         <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-[4px] bg-gradient-to-br from-zinc-500/20 to-zinc-500/5 flex items-center justify-center text-zinc-400 border border-white/5 border-t-zinc-500/40 border-l-zinc-500/20 shadow-lg">
               <Music2 className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-zinc-400">{t("total_songs")}</span>
         </div>
         <div className="mt-auto">
            <div className="flex items-baseline gap-2">
               <h3 className="text-3xl font-black text-white">{totalSongs}</h3>
               <span className="text-[11px] text-zinc-500 font-bold">{t("songs_in_your_library", "in library")}</span>
            </div>
         </div>
      </div>

      {/* Completion Rate */}
      <div className="rounded-lg p-4 text-card-foreground flex flex-col bg-zinc-900/40 shadow-sm h-full backdrop-blur-sm">
         <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
               <div className="h-8 w-8 rounded-[4px] bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center text-emerald-400 border border-white/5 border-t-emerald-500/40 border-l-emerald-500/20 shadow-lg">
                  <Trophy className="h-4 w-4" />
               </div>
               <span className="text-[10px] font-bold text-zinc-400">{t("completion_rate")}</span>
            </div>
            <span className="text-[10px] font-bold text-zinc-500 tabular-nums">{userSongs?.learned?.length || 0} / {totalSongs}</span>
         </div>
         <div className="mt-auto space-y-2.5">
             <h3 className="text-3xl font-black text-white">{learnedPercentage.toFixed(0)}%</h3>
             <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900/50">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                    style={{ width: `${learnedPercentage}%` }}
                />
             </div>
         </div>
      </div>

      {/* Player Tier */}
      <div className="rounded-lg p-4 text-card-foreground flex flex-col bg-zinc-900/40 shadow-sm h-full backdrop-blur-sm">
         <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-[4px] bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center text-amber-400 border border-white/5 border-t-amber-500/40 border-l-amber-500/20 shadow-lg">
               <Star className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-zinc-400">{t("your_skill_tier", "Skill tier")}</span>
         </div>
         
         <div className="mt-auto">
            {playerTier ? (
               <div className="flex items-center gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-2xl font-black shadow-lg"
                    style={{ color: playerTier.color, backgroundColor: 'rgba(10,10,10,0.9)' }}
                  >
                    {playerTier.tier}
                  </div>
                  <div className="flex flex-col">
                     <span className="text-lg font-black text-white/90 leading-none">Tier</span>
                     <span className="text-[10px] font-bold text-zinc-500 mt-1">
                        Power score: <span className="text-zinc-300">{skillPower.toFixed(1)}</span>
                     </span>
                  </div>
               </div>
            ) : (
               <div className="flex flex-col">
                  <h3 className="text-2xl font-black text-zinc-500">Unrated</h3>
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
