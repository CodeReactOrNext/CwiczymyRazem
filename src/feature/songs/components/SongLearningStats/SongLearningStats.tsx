import { Card } from "assets/components/ui/card";
import type { Song } from "feature/songs/types/songs.type";
import { Award, Clock, Music2, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";

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

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      {/* Total Songs - Compact */}
      <div className="flex flex-1 items-center gap-4 rounded-lg bg-zinc-900/30 p-4 backdrop-blur-sm">
         <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
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
      <div className="flex flex-1 items-center gap-4 rounded-lg  bg-zinc-900/30 p-4 backdrop-blur-sm">
         <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-500 border border-green-500/20">
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
    </div>
  );
};
