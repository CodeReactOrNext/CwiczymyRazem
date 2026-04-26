"use client";

import { cn } from "assets/lib/utils";
import type { LibrarySong } from "feature/song-library/services/getSongsForStaticProps";
import { PublicSongCard } from "feature/song-library/components/PublicSongCard";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const ALL_TIERS = ["?", "D", "C", "B", "A", "S"] as const;

interface LibrarySongGridProps {
  songs: LibrarySong[];
  totalSongs: number;
}

export const LibrarySongGrid = ({ songs, totalSongs }: LibrarySongGridProps) => {
  const [activeTier, setActiveTier] = useState<string | null>(null);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);

  const genres = useMemo(() => {
    const all = songs.flatMap((s) => s.genres);
    return Array.from(new Set(all)).sort();
  }, [songs]);

  const filtered = useMemo(() => {
    return songs.filter((s) => {
      if (activeTier && s.tier !== activeTier) return false;
      if (activeGenre && !s.genres.includes(activeGenre)) return false;
      return true;
    });
  }, [songs, activeTier, activeGenre]);

  const hasActiveFilter = activeTier !== null || activeGenre !== null;

  return (
    <section id="explore" className="py-20 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl font-bold tracking-tighter text-white mb-6 font-display">
            Explore the Library
          </h2>

          {/* Tier filter */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest mr-1">
              Tier:
            </span>
            {ALL_TIERS.map((t) => {
              const info = getSongTier(t);
              const isActive = activeTier === t;
              return (
                <button
                  key={t}
                  onClick={() => setActiveTier(isActive ? null : t)}
                  className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-md border text-[11px] font-black transition-all",
                    isActive
                      ? "shadow-lg"
                      : "border-white/10 bg-zinc-900/50 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                  )}
                  style={
                    isActive
                      ? {
                          borderColor: `${info.color}60`,
                          backgroundColor: `${info.color}15`,
                          color: info.color,
                        }
                      : undefined
                  }
                  aria-label={`Filter by ${info.label}`}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {/* Genre filter */}
          {genres.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest mr-1">
                Genre:
              </span>
              {genres.map((g) => {
                const isActive = activeGenre === g;
                return (
                  <button
                    key={g}
                    onClick={() => setActiveGenre(isActive ? null : g)}
                    className={cn(
                      "px-3 py-0.5 rounded-md border text-[10px] font-bold capitalize transition-all",
                      isActive
                        ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
                        : "border-white/10 bg-zinc-900/50 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                    )}
                  >
                    {g}
                  </button>
                );
              })}
              {hasActiveFilter && (
                <button
                  onClick={() => {
                    setActiveTier(null);
                    setActiveGenre(null);
                  }}
                  className="px-3 py-0.5 rounded-md border border-zinc-700 text-[10px] font-bold text-zinc-500 hover:text-white transition-colors ml-1"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((song) => (
              <PublicSongCard key={song.id} song={song} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-zinc-600 text-sm">
            No songs match the selected filters.
          </div>
        )}

        {/* CTA to app */}
        <div className="mt-12 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-cyan-400 transition-colors"
          >
            See all {totalSongs > 0 ? `${totalSongs}+` : ""} songs in the app
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
