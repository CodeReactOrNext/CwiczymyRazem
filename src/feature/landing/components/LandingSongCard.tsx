"use client";

import { cn } from "assets/lib/utils";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { motion } from "framer-motion";
import { Music, Users, Star } from "lucide-react";

interface LandingSongCardProps {
  song: {
    id: string;
    title: string;
    artist: string;
    avgDifficulty: number;
    coverUrl?: string;
    popularity?: number;
  };
  priority?: boolean;
}

export const LandingSongCard = ({
  song,
}: LandingSongCardProps) => {
  const avgDifficulty = song.avgDifficulty || 0;
  const tier = getSongTier(avgDifficulty);

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden radius-premium glass-card p-4 transition-background cursor-pointer h-full",
        "hover:glass-card-hover hover:shadow-xl hover:shadow-black/40"
      )}
    >
      {/* Glassmorphism Depth Borders */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />

      {/* Premium Blurred Background Cover - Replicating Portal Look */}
      {song.coverUrl && (
        <div className="absolute inset-0 z-0 overflow-hidden opacity-[0.08] transition-opacity duration-700 group-hover:opacity-[0.15]">
          <img 
            src={song.coverUrl} 
            alt=""
            className="h-full w-full object-cover blur-3xl saturate-[1.1] scale-[1.2] transition-transform duration-1000 group-hover:scale-[1.3]"
          />
          <div className="absolute inset-0 bg-zinc-950/20" />
        </div>
      )}

      {/* Header Section */}
      <div className="relative z-10 mb-4 flex items-start gap-3">
        {/* Cover Image Wrapper */}
        <div className="relative shrink-0">
          {song.coverUrl ? (
            <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-white/10 shadow-lg transition-all duration-500 group-hover:border-white/20">
              <img 
                src={song.coverUrl} 
                alt={`${song.title} cover`}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          ) : (
            <div 
              className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed border-white/5 bg-zinc-950/40 text-zinc-700 transition-colors group-hover:border-white/10"
            >
              <Music className="h-6 w-6 opacity-20" />
            </div>
          )}
          
          {/* Tier Badge */}
          <div 
              className="absolute -bottom-1 -right-1 z-20 flex h-6 w-6 items-center justify-center rounded-lg border text-[9px] font-black shadow-lg backdrop-blur-xl"
              style={{
                  borderColor: `${tier.color}40`,
                  backgroundColor: `rgba(10, 10, 10, 0.9)`,
                  color: tier.color,
              }}
          >
              {tier.tier}
          </div>
        </div>
        
        <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="line-clamp-1 text-sm font-bold text-white transition-colors group-hover:text-white/90 tracking-tight">
              {song.title}
            </h3>
            <p className="truncate text-[11px] font-medium text-zinc-400">
              {song.artist}
            </p>
            
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-all">
                <Users className="h-2.5 w-2.5 text-cyan-500" />
                <span className="text-[10px] font-black text-zinc-500 tracking-tighter">{song.popularity || 120}</span>
              </div>
            </div>
        </div>
      </div>

      {/* Stats Section: Difficulty Meter */}
      <div className="relative z-10 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400">
             <span className="uppercase tracking-widest opacity-50">Difficulty</span>
             <span style={{ color: tier.color }}>{avgDifficulty.toFixed(1)}</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-black/40 ring-1 ring-white/5">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${Math.min(avgDifficulty * 10, 100)}%`,
                backgroundColor: tier.color,
                boxShadow: `0 0 8px ${tier.color}40`,
              }}
            />
          </div>
      </div>
    </motion.div>
  );
};
