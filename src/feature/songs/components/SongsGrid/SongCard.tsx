import { Button } from "assets/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { selectUserAuth } from "feature/user/store/userSlice";
import {
  Bookmark,
  Check,
  Music,
  Plus,
  Settings2,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Loader2,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector } from "store/hooks";
import { TierBadge } from "./TierBadge";

interface SongCardProps {
  song: Song;
  onOpenDetails: () => void;
  userStatus?: SongStatus;
  footerAction?: { label: string; icon: ReactNode };
  onStatusChange?: (status: SongStatus | undefined) => void;
  isPracticeMode?: boolean;
}

export const SongCard = ({
  song,
  onOpenDetails,
  userStatus,
  footerAction,
  onStatusChange,
  isPracticeMode,
}: SongCardProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const userId = useAppSelector(selectUserAuth);
  const avgDifficulty = song.avgDifficulty || 0;
  const tier = getSongTier(avgDifficulty === 0 ? "?" : (song.tier || avgDifficulty));
  const isRated = song.difficulties?.some(d => d.userId === userId);




  return (
    <div 
      onClick={onOpenDetails}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-lg glass-card p-5 transition-all duration-500 click-behavior cursor-pointer",
        "hover:glass-card-hover hover:shadow-md hover:shadow-black/20"
      )}
    >

      {/* Glassmorphism Depth Borders */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />

      {/* Premium Blurred Background Cover */}
      {song.coverUrl && (
        <div className={cn(
          "absolute inset-0 z-0 overflow-hidden opacity-[0.1] transition-all duration-1000 group-hover:opacity-[0.22] grayscale-[0.8]",
          userStatus && "opacity-[0.06]"
        )}>
          <img 
            src={song.coverUrl} 
            alt=""
            className="h-full w-full object-cover blur-premium saturate-[0.5] scale-[1.2] transition-transform duration-1000 group-hover:scale-[1.4]"
          />
          <div className="absolute inset-0 bg-zinc-950/60" />
        </div>
      )}

      {/* User Status Badge */}
      {userStatus && (
        <div className="absolute top-0 left-0 z-30">
             <div className={cn(
               "flex items-center justify-center w-9 h-9 rounded-br backdrop-blur-md border-b border-r",
               userStatus === "wantToLearn" && "bg-zinc-800 text-amber-500 border-amber-500/30",
               userStatus === "learning" && "bg-zinc-800 text-cyan-400 border-cyan-500/30",
               userStatus === "learned" && "bg-zinc-800 text-emerald-500 border-emerald-500/30"
             )}>
                {userStatus === "wantToLearn" && <Bookmark className="h-4 w-4 fill-current" />}
                {userStatus === "learning" && <TrendingUp className="h-4 w-4" />}
                {userStatus === "learned" && <Trophy className="h-4 w-4" />}
             </div>
        </div>
      )}

      {/* Header Section with Bleed Cover */}
      <div className="relative z-10 mb-6 flex items-start">
        {/* Corner-Bleed Cover Image */}
        <div className="relative -ml-5 -mt-5 shrink-0">
          {song.coverUrl ? (
            <div className="relative h-28 w-28 overflow-hidden rounded-br-lg transition-all duration-500">
              <img 
                src={song.coverUrl} 
                alt={`${song.title} cover`}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div 
              className="flex h-28 w-28 items-center justify-center rounded-br-lg bg-zinc-900/60 text-zinc-700 transition-colors"
            >
              <Music className="h-10 w-10 opacity-20" />
            </div>
          )}
          
          {/* Tier Badge on Cover */}
          <TierBadge 
            song={song} 
            className="absolute bottom-2 right-2 z-20 scale-90" 
          />
        </div>
        
        {/* Metadata Section */}
        <div className="min-w-0 flex-1 pl-4 -mt-0.5">
            <div className="flex items-center justify-between gap-1.5">
              <h3 translate="no" className="line-clamp-1 text-base font-bold text-white">
                {song.title}
              </h3>
            </div>
            
            <p translate="no" className="truncate text-sm font-bold text-zinc-500 mt-0.5">
              {song.artist}
            </p>
            
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {song.popularity !== undefined && song.popularity > 0 && (
                <div className="flex items-center gap-1 opacity-40">
                  <Users className="h-3 w-3" />
                  <span className="text-[10px] font-bold">{song.popularity}</span>
                </div>
              )}
              {song.genres && song.genres.length > 0 && (
                <>
                  <span className="h-1 w-1 rounded-full bg-zinc-800" />
                  {song.genres.slice(0, 1).map(g => (
                    <span key={g} className="capitalize text-[10px] font-bold text-zinc-600">
                      {g}
                    </span>
                  ))}
                </>
              )}
              {isRated && (
                <>
                  <span className="h-1 w-1 rounded-full bg-zinc-800" />
                  <span className="text-[10px] font-bold text-amber-500/70">
                    Rated
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Section: Difficulty Meter */}
        <div className="relative z-10 mb-6 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 transition-colors">
               <span>Difficulty</span>
               <div className="flex items-center gap-1.5">
                 {isRated && (
                   <TooltipProvider delayDuration={100}>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <Star className="h-3 w-3 fill-current animate-in zoom-in duration-300" style={{ color: tier.color }} />
                       </TooltipTrigger>
                       <TooltipContent side="top" className="bg-zinc-900 border-white/10 text-[10px] font-bold text-zinc-200">
                         Your rating is included
                       </TooltipContent>
                     </Tooltip>
                   </TooltipProvider>
                 )}
                 <span className="text-sm font-bold" style={{ color: tier.color }}>{avgDifficulty.toFixed(1)}</span>
               </div>
            </div>
            <div className="h-1 w-full overflow-hidden rounded bg-black/40">
              <div
                className="h-full rounded transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.min(avgDifficulty * 10, 100)}%`,
                  backgroundColor: tier.color,
                }}
              />
            </div>
        </div>

        <div className="relative z-10 mt-auto flex items-center gap-2 p-0.5 rounded-lg backdrop-blur-sm">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails();
            }}
            variant="ghost"
            className={cn(
              "h-8 flex-1 group/btn flex items-center justify-between rounded-lg px-3 text-[10px] font-bold transition-all gap-3",
              isPracticeMode
                ? "bg-white text-black hover:bg-zinc-100 group-hover/btn:text-black"
                : "text-zinc-300 hover:bg-white/5"
            )}
          >
            <span className={cn("tracking-wide", isPracticeMode && "!text-black")}>{isPracticeMode ? "Practice" : "View Details"}</span>
            {isPracticeMode ? (
              <ArrowRight className="h-3 w-3 opacity-70 transition-transform group-hover/btn:translate-x-0.5 !text-black ml-1" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 opacity-50 transition-transform group-hover/btn:translate-x-1 group-hover:opacity-100 ml-1" />
            )}
          </Button>

          {!isPracticeMode && onStatusChange && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (isProcessing || isAdded || userStatus) return;
                      setIsProcessing(true);
                      try {
                        await onStatusChange("wantToLearn");
                        setIsAdded(true);
                      } catch (error) {
                        setIsProcessing(false);
                      }
                    }}
                    className={cn(
                      "h-8 w-9 shrink-0 rounded-lg transition-all active:scale-95 overflow-hidden relative border",
                      (isProcessing || isAdded || userStatus)
                        ? "bg-zinc-800 text-emerald-500 border-emerald-500/30"
                        : "bg-white text-black hover:bg-zinc-200 border-transparent"
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {isProcessing || isAdded || userStatus ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="flex items-center justify-center"
                        >
                          {isProcessing && !isAdded ? (
                            <Loader2 className="h-4 w-4 animate-spin opacity-70" />
                          ) : (
                            <Check className="h-4 w-4 stroke-[4]" />
                          )}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="plus"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 1.5, opacity: 0 }}
                        >
                          <Plus className="h-4 w-4 stroke-[3]" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-zinc-900 border-white/10 text-zinc-200 font-bold">
                  {isAdded || userStatus ? "In Library" : "Add to Library"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
    </div>
  );
};
