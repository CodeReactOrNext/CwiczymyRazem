import type { Song } from "feature/songs/types/songs.type";
import { calculateSkillPower } from "feature/songs/utils/difficulty.utils";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { Music2, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";

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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {/* Total Songs - Compact */}
      <div className="flex flex-1 items-center gap-4 rounded-lg  p-4 ">
         <div className="rounded-lg bg-second p-2">
            <Music2 className="h-5 w-5" />
         </div>
         <div>
            <p className="text-sm font-medium text-zinc-400">{t("total_songs")}</p>
            <div className="flex items-baseline gap-2">
               <h3 className="text-xl font-bold text-white">{totalSongs}</h3>
               <span className="text-xs text-zinc-500">{t("songs_in_your_library", "in library")}</span>
            </div>
         </div>
      </div>

      {/* Completion Rate - Compact */}
      <div className="flex flex-1 items-center gap-4 rounded-lg   p-4 ">
         <div className="rounded-lg bg-second p-2">
            <Trophy className="h-5 w-5" />
         </div>
         <div className="flex-1">
             <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-400">{t("completion_rate")}</p>
                <span className="text-xs text-zinc-500">{userSongs.learned.length} / {totalSongs}</span>
             </div>
             <div className="flex items-center gap-3">
                 <h3 className="text-xl font-bold text-white">{learnedPercentage.toFixed(0)}%</h3>
                 
                 <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                    <div
                        className="h-full rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                        style={{ width: `${learnedPercentage}%` }}
                    />
                 </div>
             </div>
         </div>
      </div>

      {/* Player Tier - New */}
      <div className="flex flex-1 items-center gap-4 rounded-lg  p-4 ">
         <TierBadge difficulty={skillPower} className="h-10 w-10 text-sm" />
         <div>
            <p className="text-sm font-medium text-zinc-400">{t("your_skill_tier", "Skill Tier")}</p>
            <div className="flex items-baseline gap-2">
               <h3 className="text-xl font-bold text-white" style={{ color: playerTier?.color }}>
                   {playerTier ? playerTier.tier + "-Tier" : "N/A"}
               </h3>
               {playerTier && (
                   <span className="text-xs text-zinc-500">
                       (Power: {skillPower.toFixed(1)})
                   </span>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};
