import { Button } from "assets/components/ui/button";
import type { Song } from "feature/songs/types/songs.type";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { 
  Music, 
  Users,
  Settings2,
  ShieldCheck
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "assets/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";

interface SongCardProps {
  song: Song;
  onOpenDetails: () => void;
}

export const SongCard = ({
  song,
  onOpenDetails,
}: SongCardProps) => {
  const { t } = useTranslation("songs");
  const avgDifficulty = song.avgDifficulty || 0;
  const tier = getSongTier(avgDifficulty);

  return (
    <div 
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-zinc-900/40 p-5 backdrop-blur-md transition-all duration-500",
        "border-white/5 hover:border-white/10 hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-1"
      )}
    >
      {/* Glassmorphism Depth Borders */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />

      {/* Premium Blurred Background Cover */}
      {song.coverUrl && (
        <div className="absolute inset-0 z-0 overflow-hidden opacity-[0.17] transition-opacity duration-1000 group-hover:opacity-[0.28]">
          <img 
            src={song.coverUrl} 
            alt=""
            className="h-full w-full object-cover blur-[55px] saturate-[1.1] scale-[1.5] transition-transform duration-1000 group-hover:scale-[2]"
          />
          <div className="absolute inset-0 bg-zinc-950/30" />
        </div>
      )}

      {/* Header Section */}
      <div className="relative z-10 mb-6 flex items-start gap-4">
        {/* Cover Image Wrapper */}
        <div className="relative shrink-0">
          {song.coverUrl ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-all duration-500 group-hover:border-white/20">
              <img 
                src={song.coverUrl} 
                alt={`${song.title} cover`}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
          ) : (
            <div 
              className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-white/5 bg-zinc-950/40 text-zinc-700 transition-colors group-hover:border-white/10"
            >
              <Music className="h-6 w-6 opacity-20" />
            </div>
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
            <div className="flex items-center gap-1.5">
              <h3 className="line-clamp-1 text-sm font-bold text-white transition-colors group-hover:text-white/90">
                {song.title}
              </h3>
              {song.isVerified && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-cyan-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-900 border-white/10 text-zinc-300">
                      <p>Native Verification: This song's existence is confirmed.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            <p className="truncate text-[11px] font-medium text-zinc-500">
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
                    <span key={g} className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-zinc-400 transition-colors">
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
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-zinc-600 group-hover:text-zinc-500 transition-colors">
               <span>Difficulty</span>
               <span className="text-sm" style={{ color: tier.color }}>{avgDifficulty.toFixed(1)}</span>
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
            onClick={onOpenDetails}
            variant="outline"
            className="h-10 w-full group/btn justify-between rounded-xl border-white/5 bg-white/[0.02] px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 transition-all hover:bg-white/10 hover:text-white hover:border-white/10"
          >
            <span>Open details</span>
            <Settings2 className="h-3.5 w-3.5 opacity-40 transition-transform group-hover/btn:rotate-90" />
          </Button>
        </div>
      </div>
    );
};
