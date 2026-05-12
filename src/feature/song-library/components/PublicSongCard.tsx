"use client";

import { cn } from "assets/lib/utils";
import type { LibrarySong } from "feature/song-library/services/getSongsForStaticProps";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { ArrowRight, Music, Users } from "lucide-react";
import Link from "next/link";

interface PublicSongCardProps {
  song: LibrarySong;
}

export const PublicSongCard = ({ song }: PublicSongCardProps) => {
  const avgDifficulty = song.avgDifficulty || 0;
  const tier = getSongTier(avgDifficulty === 0 ? "?" : (song.tier || avgDifficulty));

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-lg glass-card p-5 transition-background",
        "hover:glass-card-hover hover:shadow-xl hover:shadow-black/40"
      )}
    >
      {/* Glassmorphism depth border */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />

      {/* Blurred background cover */}
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

      {/* Header */}
      <div className="relative z-10 mb-6 flex items-start gap-4">
        {/* Cover image */}
        <div className="relative shrink-0">
          {song.coverUrl ? (
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              <img
                src={song.coverUrl}
                alt={`${song.title} cover`}
                width={80}
                height={80}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-white/5 bg-zinc-950/40 text-zinc-700">
              <Music className="h-8 w-8 opacity-20" />
            </div>
          )}

          {/* Tier badge */}
          <div
            className="absolute -bottom-1 -right-1 z-20 flex h-7 w-7 items-center justify-center rounded-lg border text-[10px] font-black shadow-lg backdrop-blur-xl"
            style={{
              borderColor: `${tier.color}40`,
              backgroundColor: "rgba(10, 10, 10, 0.9)",
              color: tier.color,
            }}
          >
            {tier.tier}
          </div>
        </div>

        <div className="min-w-0 flex-1 pt-1">
          <h3
            translate="no"
            className="line-clamp-1 text-base font-bold text-white transition-colors group-hover:text-white/90"
          >
            {song.title}
          </h3>
          <p translate="no" className="truncate text-sm font-medium text-zinc-400">
            {song.artist}
          </p>

          <div className="mt-2 flex items-center gap-3">
            {song.popularity > 0 && (
              <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-all">
                <Users className="h-3 w-3 text-cyan-500" />
                <span className="text-[11px] font-black text-zinc-500 tracking-tighter">
                  {song.popularity}
                </span>
              </div>
            )}
            {song.genres.length > 0 && (
              <span className="px-2.5 py-0.5 capitalize rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-400">
                {song.genres[0]}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Difficulty meter */}
      <div className="relative z-10 mb-6 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
          <span>Difficulty</span>
          <span className="text-sm font-bold" style={{ color: tier.color }}>
            {avgDifficulty > 0 ? avgDifficulty.toFixed(1) : "—"}
          </span>
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

      {/* CTA footer */}
      <div className="relative z-10 mt-auto">
        <Link
          href="/signup"
          className="flex h-8 w-full items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 text-[10px] font-bold text-zinc-500 transition-all hover:bg-white/10 hover:text-white"
        >
          <span>Start Learning</span>
          <ArrowRight className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>
    </div>
  );
};
