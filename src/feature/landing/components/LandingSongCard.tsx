"use client";

import { cn } from "assets/lib/utils";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { motion } from "framer-motion";
import { Music, Users } from "lucide-react";
import Image from "next/image";

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
  priority,
}: LandingSongCardProps) => {
  const avgDifficulty = song.avgDifficulty || 0;
  const tier = getSongTier(avgDifficulty);

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden radius-premium glass-card p-5 transition-all duration-500",
        "hover:glass-card-hover hover:shadow-2xl hover:shadow-black/60"
      )}
    >
      {/* Glassmorphism Depth Borders */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />

      {/* Premium Blurred Background Cover */}
      {song.coverUrl && (
        <div className="absolute inset-0 z-0 overflow-hidden opacity-[0.12] transition-opacity duration-1000 group-hover:opacity-[0.22]">
          <Image 
            src={song.coverUrl} 
            alt={song.title ? `${song.title} background` : "Song background"}
            fill
            className="h-full w-full object-cover blur-premium saturate-[1.1] scale-[1.2] transition-transform duration-1000 group-hover:scale-[1.4]"
            priority={priority}
          />
          <div className="absolute inset-0 bg-zinc-950/30" />
        </div>
      )}

      {/* Header Section */}
      <div className="relative z-10 mb-6 flex items-start gap-4">
        {/* Cover Image Wrapper */}
        <div className="relative shrink-0">
          {song.coverUrl ? (
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-all duration-500 group-hover:border-white/20">
              <Image 
                src={song.coverUrl} 
                alt={`${song.title} cover`}
                width={80}
                height={80}
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                unoptimized={true}
                priority={priority}
              />
            </div>
          ) : (
            <div 
              className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-white/5 bg-zinc-950/40 text-zinc-700 transition-colors group-hover:border-white/10"
            >
              <Music className="h-8 w-8 opacity-20" />
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
            <h3 className="line-clamp-1 text-base font-bold text-white transition-colors group-hover:text-white/90">
              {song.title}
            </h3>
            <p className="truncate text-sm font-medium text-zinc-400">
              {song.artist}
            </p>
            
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-1.5 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                <Users className="h-3 w-3 text-cyan-500" />
                <span className="text-[11px] font-black text-zinc-500 tracking-tighter">
                  {song.popularity || Math.floor(Math.random() * 500) + 100}
                </span>
              </div>
            </div>
        </div>
      </div>

      {/* Stats Section: Difficulty Meter */}
      <div className="relative z-10 mb-2 space-y-2">
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
    </motion.div>
  );
};
