"use client";

import { Music } from "lucide-react";
import { cn } from "assets/lib/utils";
import { getSongTier } from "feature/songs/utils/getSongTier";
import Image from "next/image";

interface LandingSongCardProps {
  song: {
    id: string;
    title: string;
    artist: string;
    avgDifficulty: number;
    coverUrl?: string;
  };
}

export const LandingSongCard = ({
  song,
}: LandingSongCardProps) => {
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
          <Image 
            src={song.coverUrl} 
            alt=""
            fill
            className="object-cover blur-[55px] saturate-[1.1] scale-[1.5] transition-transform duration-1000 group-hover:scale-[2]"
            unoptimized={true}
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
              <Image 
                src={song.coverUrl} 
                alt={`${song.title} cover`}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                unoptimized={true}
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
            <h3 className="line-clamp-1 text-sm font-bold text-white transition-colors group-hover:text-white/90">
              {song.title}
            </h3>
            <p className="truncate text-[11px] font-medium text-zinc-500">
              {song.artist}
            </p>
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

    </div>
  );
};
