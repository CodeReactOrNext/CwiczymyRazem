import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { useSongsStatusChange } from "feature/songs/hooks/useSongsStatusChange";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { Info,Music, Play, Plus, Star, Users } from "lucide-react";
import { useRouter } from "next/router";
import React from "react";

import { TierBadge } from "../SongsGrid/TierBadge";

interface DailyRecommendationProps {
  song: Song;
  userSongs: {
    wantToLearn: Song[];
    learning: Song[];
    learned: Song[];
  };
  onRefreshSongs: () => void;
  onOpenDetails: (song: Song) => void;
}

export const DailyRecommendation = ({ song, userSongs, onRefreshSongs, onOpenDetails }: DailyRecommendationProps) => {
  const router = useRouter();
  const [isAdding, setIsAdding] = React.useState(false);
  const { handleStatusChange } = useSongsStatusChange({
    userSongs,
    onChange: () => {}, // Handled by onRefreshSongs
    onTableStatusChange: onRefreshSongs,
  });

  const handleAdd = async (status: SongStatus) => {
    setIsAdding(true);
    try {
      await handleStatusChange(song.id, status, song.title, song.artist);
    } finally {
      setIsAdding(false);
    }
  };

  const handlePractice = () => {
    router.push(`/timer/song/${song.id}`);
  };

  const isLearning = userSongs.learning.some((s) => s.id === song.id);
  const isLearned = userSongs.learned.some((s) => s.id === song.id);
  const isWantToLearn = userSongs.wantToLearn.some((s) => s.id === song.id);

  return (
    <Card className="group relative overflow-hidden border-white/5 bg-zinc-900/40 p-6 backdrop-blur-xl shadow-2xl transition-all hover:border-cyan-500/30">
      {/* Background Glow */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-[100px] transition-all group-hover:bg-cyan-500/20" />
      
      {/* Blurred Cover Background */}
      {song.coverUrl && (
        <div className="absolute inset-0 -z-10 opacity-[0.08] transition-opacity duration-700 group-hover:opacity-[0.14]">
          <img src={song.coverUrl} alt="" className="h-full w-full object-cover blur-3xl scale-110" />
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/80 to-transparent" />
        </div>
      )}

      <div className="relative z-10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4 sm:gap-5">
            {/* Song Cover / Icon */}
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-2xl">
              {song.coverUrl ? (
                <img src={song.coverUrl} alt={song.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Music className="h-10 w-10 text-zinc-700" />
                </div>
              )}
                <TierBadge song={song} className="absolute top-2 right-2" />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-sm border border-cyan-500/20 px-2.5 py-0.5 text-[10px] font-medium text-cyan-400">
                  Pick of the day
                </div>
              </div>
              <h3 className="truncate text-xl sm:text-2xl font-medium text-white group-hover:text-cyan-100 transition-colors">
                {song.title}
              </h3>
              <p className="truncate text-sm font-bold text-zinc-400">{song.artist}</p>
              
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold text-zinc-500">
                 <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
                    <span>{song.avgDifficulty?.toFixed(1) || 0} Difficulty</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-cyan-500" />
                    <span>{song.popularity || 0} practicing</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 xl:mt-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenDetails(song)}
              className="h-9 w-9 shrink-0 rounded-lg border border-white/5 bg-white/5 text-zinc-400 transition-all hover:bg-white/10 hover:text-white active:scale-95"
              title="View Details"
            >
              <Info className="h-4 w-4" />
            </Button>
            
            {isLearning && (
              <Button
                variant="default"
                onClick={handlePractice}
                className="h-9 flex-1 sm:flex-none rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white px-3 sm:px-6 text-xs sm:text-sm font-black  tracking-widest transition-all active:scale-95 shadow-lg shadow-cyan-500/20 border-0"
              >
                <Play className="mr-1.5 sm:mr-2 h-3.5 sm:h-4 w-3.5 sm:w-4 fill-current" />
               Practice
              </Button>
            )}

            {!isWantToLearn && !isLearning && !isLearned && (
              <Button
                variant="secondary"
                disabled={isAdding}
                onClick={() => handleAdd("wantToLearn")}
                className="h-9 flex-1 sm:flex-none rounded-lg px-3 sm:px-4 text-xs sm:text-sm transition-all active:scale-95 whitespace-nowrap"
              >
                <Plus className="mr-1.5 sm:mr-2 h-3.5 sm:h-4 w-3.5 sm:w-4" />
                {isAdding ? "Adding..." : "Want to Learn"}
              </Button>
            )}
            
            {!isLearning && !isLearned && (
              <Button
                variant="default"
                disabled={isAdding}
                onClick={() => handleAdd("learning")}
                className="h-9 flex-1 sm:flex-none rounded-lg px-3 sm:px-4 text-xs sm:text-sm transition-all active:scale-95 whitespace-nowrap"
              >
                <Play className="mr-1.5 sm:mr-2 h-3.5 sm:h-4 w-3.5 sm:w-4 fill-current" />
                {isAdding ? "Adding..." : "Start Learning"}
              </Button>
            )}
            
            {isLearned && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                Mastered
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
