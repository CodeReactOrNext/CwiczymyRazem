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
        "group relative flex flex-col justify-between overflow-hidden rounded-lg glass-card p-5 transition-all duration-500 click-behavior cursor-pointer border border-white/5",
        "hover:glass-card-hover hover:shadow-2xl hover:shadow-black/60",
        userStatus && "border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.1)]"
      )}
    >
      {/* Premium Completed Glow */}
      {userStatus && (
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
      )}
      {/* Glassmorphism Depth Borders */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />

      {/* Premium Blurred Background Cover */}
      {song.coverUrl && (
        <div className={cn(
          "absolute inset-0 z-0 overflow-hidden opacity-[0.12] transition-all duration-1000 group-hover:opacity-[0.22]",
          userStatus && "opacity-[0.08] grayscale-[0.5]"
        )}>
          <img 
            src={song.coverUrl} 
            alt=""
            className="h-full w-full object-cover blur-premium saturate-[1.1] scale-[1.2] transition-transform duration-1000 group-hover:scale-[1.4]"
          />
          <div className="absolute inset-0 bg-zinc-950/40" />
        </div>
      )}

      {/* User Status Badge */}
      {userStatus && (
        <div className="absolute top-0 right-0 z-30">
             <div className={cn(
               "flex items-center gap-1.5 px-3 py-1.5 rounded-bl text-[10px] font-black capitalize tracking-wider backdrop-blur-md shadow-lg border-b border-l",
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
            <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-white/10 shadow-2xl transition-all duration-500 group-hover:border-white/20">
              <img 
                src={song.coverUrl} 
                alt={`${song.title} cover`}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div 
              className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-white/5 bg-zinc-950/40 text-zinc-700 transition-colors group-hover:border-white/10"
            >
              <Music className="h-8 w-8 opacity-20" />
            </div>
          )}
          
          {/* Tier Badge */}
          <TierBadge 
            song={song} 
            className="absolute -bottom-1 -right-1 z-20" 
          />
        </div>
        
        <div className="min-w-0 flex-1 pt-1">
            <div className="flex items-center justify-between gap-1.5">
              <h3 translate="no" className="line-clamp-1 text-base font-bold text-white transition-colors group-hover:text-white/90">
                {song.title}
              </h3>
            </div>
            
            <p translate="no" className="truncate text-sm font-medium text-zinc-400">
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
                    <span key={g} className="px-2.5 py-0.5 capitalize rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-400 transition-colors">
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
            <div className="h-1.5 w-full overflow-hidden rounded bg-black/40 p-0.5 ring-1 ring-white/5">
              <div
                className="h-full rounded transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.min(avgDifficulty * 10, 100)}%`,
                  backgroundColor: tier.color,
                  boxShadow: `0 0 10px ${tier.color}40`,
                }}
              />
            </div>
        </div>

        <div className="relative z-10 mt-auto flex items-center gap-2 p-1 rounded-lg bg-black/20 border border-white/5 backdrop-blur-sm">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails();
            }}
            variant="ghost"
            className={cn(
              "h-9 flex-1 group/btn justify-between rounded-lg px-4 text-[11px] font-bold transition-all",
              isPracticeMode
                ? "bg-white text-black hover:bg-zinc-100 group-hover/btn:text-black"
                : "text-zinc-300 hover:bg-white/5"
            )}
          >
            <span className={cn("tracking-wide", isPracticeMode && "!text-black")}>{isPracticeMode ? "Practice" : "View Details"}</span>
            {isPracticeMode ? (
              <ArrowRight className="h-3.5 w-3.5 opacity-70 transition-transform group-hover/btn:translate-x-0.5 !text-black ml-2" />
            ) : (
              <Settings2 className="h-3.5 w-3.5 opacity-50 transition-transform group-hover/btn:rotate-90 group-hover:opacity-100" />
            )}
          </Button>

          {!userStatus && !isPracticeMode && onStatusChange && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (isProcessing || isAdded) return;
                      setIsProcessing(true);
                      try {
                        await onStatusChange("wantToLearn");
                        setIsAdded(true);
                      } catch (error) {
                        setIsProcessing(false);
                      }
                    }}
                    className={cn(
                      "h-9 w-10 shrink-0 rounded-lg transition-all active:scale-95 border-none shadow-lg overflow-hidden relative",
                      (isProcessing || isAdded)
                        ? "bg-emerald-500 text-white shadow-emerald-500/40 hover:bg-emerald-500"
                        : "bg-white text-black hover:bg-zinc-200 shadow-white/10"
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {isProcessing || isAdded ? (
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
                  {isAdded ? "Added to Library" : "Add to Library"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
    </div>
  );
};
