import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { useSongsStatusChange } from "feature/songs/hooks/useSongsStatusChange";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { ChevronRight, Info,Music, Play, Plus, Star, Users } from "lucide-react";
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
    <Card className="flex-col justify-between h-full">
      <div className="h-full">
        <div className="flex flex-col justify-between gap-6 h-full">
          <div className="flex items-start gap-4 sm:gap-5 flex-1">
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
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-zinc-200 tracking-wider">Recommended Song</h3>
              </div>
              <h3 className="truncate text-xl sm:text-2xl font-bold text-white group-hover:text-cyan-100 transition-colors">
                {song.title}
              </h3>
              <p className="truncate text-sm font-bold text-zinc-400 mb-2">{song.artist}</p>
              
              <div className="flex flex-wrap items-center gap-2 mt-4">
                 <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-zinc-400">
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500/20" />
                    <span>{song.avgDifficulty?.toFixed(1) || 0} Difficulty</span>
                 </div>
                 <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-zinc-400">
                    <Users className="h-3 w-3 text-cyan-500" />
                    <span>{song.popularity || 0} practicing</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenDetails(song)}
              className="h-10 w-10 shrink-0 rounded-lg bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              title="View Details"
            >
              <Info className="h-5 w-5" />
            </Button>
            
            {isLearning && (
              <Button
                onClick={handlePractice}
                className="flex-1 sm:flex-none"
              >
                Practice
                <ChevronRight size={14} strokeWidth={3} className="ml-1" />
              </Button>
            )}

            {!isWantToLearn && !isLearning && !isLearned && (
              <Button
                variant="secondary"
                disabled={isAdding}
                onClick={() => handleAdd("wantToLearn")}
                className="flex-1 sm:flex-none whitespace-nowrap"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                {isAdding ? "Adding..." : "Want to Learn"}
              </Button>
            )}
            
            {!isLearning && !isLearned && (
              <Button
                disabled={isAdding}
                onClick={() => handleAdd("learning")}
                className="flex-1 sm:flex-none whitespace-nowrap"
              >
                {isAdding ? "Adding..." : "Start Learning"}
                <ChevronRight size={14} strokeWidth={3} className="ml-1" />
              </Button>
            )}
            
            {isLearned && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest leading-none h-9 flex-1 sm:flex-none">
                Mastered
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
