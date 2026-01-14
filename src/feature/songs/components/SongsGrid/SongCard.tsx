import { Button } from "assets/components/ui/button";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { 
  Star,
  Bookmark,
  TrendingUp,
  Trophy,
  Music, 
  Users,
  Settings2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "assets/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { useAppSelector } from "store/hooks";
import { selectUserAuth } from "feature/user/store/userSlice";

interface SongCardProps {
  song: Song;
  onOpenDetails: () => void;
  userStatus?: SongStatus;
}

export const SongCard = ({
  song,
  onOpenDetails,
  userStatus,
}: SongCardProps) => {
  const { t } = useTranslation("songs");
  const userId = useAppSelector(selectUserAuth);
  const avgDifficulty = song.avgDifficulty || 0;
  const tier = getSongTier(song.tier || avgDifficulty);
  const isRated = song.difficulties?.some(d => d.userId === userId);


  return (
    <div 
      onClick={onOpenDetails}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden radius-premium glass-card p-5 transition-background click-behavior cursor-pointer",
        "hover:glass-card-hover hover:shadow-xl hover:shadow-black/40"
      )}
    >
      {/* Glassmorphism Depth Borders */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />

      {/* Premium Blurred Background Cover */}
      {song.coverUrl && (
        <div className="absolute inset-0 z-0 overflow-hidden opacity-[0.12] transition-opacity duration-1000 group-hover:opacity-[0.22]">
          <img 
            src={song.coverUrl} 
            alt=""
            className="h-full w-full object-cover blur-premium saturate-[1.1] scale-[1.2] transition-transform duration-1000 group-hover:scale-[1.4]"
          />
          <div className="absolute inset-0 bg-zinc-950/30" />
        </div>
      )}

      {/* User Status Badge */}
      {userStatus && (
        <div className="absolute top-0 right-0 z-30">
             <div className={cn(
               "flex items-center gap-1.5 px-3 py-1.5 rounded-bl-xl text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg border-b border-l",
               userStatus === "wantToLearn" && "bg-amber-500/20 text-amber-400 border-amber-500/20",
               userStatus === "learning" && "bg-cyan-500/20 text-cyan-400 border-cyan-500/20",
               userStatus === "learned" && "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
             )}>
                {userStatus === "wantToLearn" && <Bookmark className="h-3 w-3 fill-current" />}
                {userStatus === "learning" && <TrendingUp className="h-3 w-3" />}
                {userStatus === "learned" && <Trophy className="h-3 w-3" />}
                {userStatus === "wantToLearn" && "Want to Learn"}
                {userStatus === "learning" && "Practicing"}
                {userStatus === "learned" && "Completed"}
             </div>
        </div>
      )}

      {/* Header Section */}
      <div className="relative z-10 mb-6 flex items-start gap-4">
        {/* Cover Image Wrapper */}
        <div className="relative shrink-0">
          {song.coverUrl ? (
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-all duration-500 group-hover:border-white/20">
              <img 
                src={song.coverUrl} 
                alt={`${song.title} cover`}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          ) : (
            <div 
              className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-white/5 bg-zinc-950/40 text-zinc-700 transition-colors group-hover:border-white/10"
            >
              <Music className="h-8 w-8 opacity-20" />
            </div>
          )}
          
          {/* Rated Status Badge */}
          {isRated && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute -top-1 -left-1 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-amber-500/30 bg-zinc-950/90 text-amber-500 shadow-lg backdrop-blur-xl">
                    <Star className="h-3.5 w-3.5 fill-amber-500/20" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>You have rated this song</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Tier Badge */}
          <div 
              className="absolute -bottom-1 -right-1 z-20 flex h-7 w-7 items-center justify-center rounded-lg border text-[10px] font-black shadow-lg backdrop-blur-xl"
              style={{
                  borderColor: `${tier.color}40`,
                  backgroundColor: `rgba(10, 10, 10, 0.9)`,
                  color: tier.color,
              }}
          >
              {tier.tier}
          </div>
        </div>
        
        <div className="min-w-0 flex-1 pt-1">
            <div className="flex items-center justify-between gap-1.5">
              <h3 className="line-clamp-1 text-base font-bold text-white transition-colors group-hover:text-white/90">
                {song.title}
              </h3>
            </div>
            
            <p className="truncate text-sm font-medium text-zinc-400">
              {song.artist}
            </p>
            
            <div className="mt-2 flex items-center gap-3">
              {song.popularity !== undefined && song.popularity > 0 && (
                <div className="flex items-center gap-1.5 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                  <Users className="h-3 w-3 text-cyan-500" />
                  <span className="text-[11px] font-black text-zinc-500 tracking-tighter">{song.popularity}</span>
                </div>
              )}
              {song.genres && song.genres.length > 0 && (
                <div className="flex gap-1">
                  {song.genres.slice(0, 1).map(g => (
                    <span key={g} className="px-2.5 py-0.5 capitalize rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-400 transition-colors">
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Section: Difficulty Meter */}
        <div className="relative z-10 mb-6 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 transition-colors">
               <span>Difficulty</span>
               <span className="text-sm font-bold" style={{ color: tier.color }}>{avgDifficulty.toFixed(1)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/40 p-0.5 ring-1 ring-white/5">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.min(avgDifficulty * 10, 100)}%`,
                  backgroundColor: tier.color,
                  boxShadow: `0 0 10px ${tier.color}40`,
                }}
              />
            </div>
        </div>

        {/* Minimal Footer Action */}
        <div className="relative z-10 mt-auto">
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails();
            }}
            variant="outline"
            className="h-8 w-full group/btn justify-between radius-default border-white/5 bg-white/[0.02] px-4 text-[10px] font-bold text-zinc-500 transition-background hover:bg-white/10 hover:text-white"
          >
            <span>Open details</span>
            <Settings2 className="h-3.5 w-3.5 opacity-40 transition-transform group-hover/btn:rotate-90" />
          </Button>
        </div>
      </div>
    );
};
