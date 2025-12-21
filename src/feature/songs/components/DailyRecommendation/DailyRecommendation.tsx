import React from "react";
import { Sparkles, Plus, Music, Star, Users, Check, Play, Info } from "lucide-react";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { cn } from "assets/lib/utils";
import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { useSongsStatusChange } from "feature/songs/hooks/useSongsStatusChange";
import { toast } from "sonner";

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
  const [isAdding, setIsAdding] = React.useState(false);
  const { handleStatusChange } = useSongsStatusChange({
    userSongs,
    onChange: () => {}, // Handled by onRefreshSongs
    onTableStatusChange: onRefreshSongs,
  });

  const tier = getSongTier(song.avgDifficulty || 0);

  const handleAdd = async (status: SongStatus) => {
    setIsAdding(true);
    try {
      await handleStatusChange(song.id, status, song.title, song.artist);
    } finally {
      setIsAdding(false);
    }
  };

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
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-5">
            {/* Song Cover / Icon */}
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-2xl">
              {song.coverUrl ? (
                <img src={song.coverUrl} alt={song.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Music className="h-10 w-10 text-zinc-700" />
                </div>
              )}
              <div 
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-[10px] font-black backdrop-blur-md shadow-xl"
                style={{ color: tier.color, backgroundColor: `${tier.color}20` }}
              >
                {tier.tier}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-cyan-400">
                  <Sparkles className="h-2.5 w-2.5" />
                  Pick of the Day
                </div>
              </div>
              <h3 className="text-2xl font-black tracking-tight text-white group-hover:text-cyan-100 transition-colors">
                {song.title}
              </h3>
              <p className="text-sm font-bold text-zinc-400">{song.artist}</p>
              
              <div className="mt-3 flex items-center gap-4 text-[11px] font-bold text-zinc-500">
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

          <div className="flex flex-wrap items-center gap-3 mt-4 lg:mt-0 lg:flex-nowrap">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenDetails(song)}
              className="h-9 w-9 rounded-lg border border-white/5 bg-white/5 text-zinc-400 transition-all hover:bg-white/10 hover:text-white active:scale-95"
              title="View Details"
            >
              <Info className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              disabled={isAdding}
              onClick={() => handleAdd("wantToLearn")}
              className="h-9 rounded-lg px-6 transition-all active:scale-95"
            >
              <Plus className="mr-2 h-4 w-4" />
              {isAdding ? "Adding..." : "Want to Learn"}
            </Button>
            <Button
              variant="default"
              disabled={isAdding}
              onClick={() => handleAdd("learning")}
              className="h-9 rounded-lg px-6 transition-all active:scale-95"
            >
              <Play className="mr-2 h-4 w-4 fill-current" />
              {isAdding ? "Adding..." : "Start Learning"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
