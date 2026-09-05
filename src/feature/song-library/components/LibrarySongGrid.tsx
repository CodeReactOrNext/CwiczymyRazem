"use client";

import { cn } from "assets/lib/utils";
import { PublicSongCard } from "feature/song-library/components/PublicSongCard";
import type { LibrarySong } from "feature/song-library/services/getSongsForStaticProps";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const ALL_TIERS = ["?", "D", "C", "B", "A", "S"] as const;

/** Plain-language name for each tier — "D" alone means nothing to a first-time
 *  visitor, and the tier guide explaining it sits further down the page. */
const TIER_WORDS: Record<(typeof ALL_TIERS)[number], string> = {
  "?": "Unrated",
  D: "Beginner",
  C: "Intermediate",
  B: "Advanced",
  A: "Expert",
  S: "Legendary",
};

/** Genres shown before "More genres" — the full list pushed the cards a full
 *  screen down the page on a phone. */
const GENRES_BEFORE_FOLD = 6;

interface LibrarySongGridProps {
  songs: LibrarySong[];
  totalSongs: number;
  /** Firestore song id -> slug of the difficulty guide written for it. */
  guideSlugBySongId?: Record<string, string>;
}

export const LibrarySongGrid = ({
  songs,
  totalSongs,
  guideSlugBySongId = {},
}: LibrarySongGridProps) => {
  const [activeTier, setActiveTier] = useState<string | null>(null);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showAllGenres, setShowAllGenres] = useState(false);

  // Most popular first, so the short list behind "More genres" is the useful one.
  const genres = useMemo(() => {
    const counts = new Map<string, number>();
    for (const song of songs) {
      for (const genre of song.genres) {
        counts.set(genre, (counts.get(genre) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([genre]) => genre);
  }, [songs]);

  const visibleGenres =
    showAllGenres || activeGenre ? genres : genres.slice(0, GENRES_BEFORE_FOLD);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return songs.filter((song) => {
      if (activeTier && song.tier !== activeTier) return false;
      if (activeGenre && !song.genres.includes(activeGenre)) return false;
      if (
        needle &&
        !song.title.toLowerCase().includes(needle) &&
        !song.artist.toLowerCase().includes(needle)
      ) {
        return false;
      }
      return true;
    });
  }, [songs, activeTier, activeGenre, query]);

  const hasActiveFilter =
    activeTier !== null || activeGenre !== null || query.trim() !== "";

  return (
    <section id="explore" className="py-20 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl font-bold tracking-tighter text-white mb-6 font-display">
            Explore the Library
          </h2>

          {/* Search first: on a phone it is the fastest route to one song */}
          <div className="relative mb-6 max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by song or artist"
              aria-label="Search the song library by song or artist"
              className="h-11 w-full rounded-lg bg-zinc-900/60 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
            />
          </div>

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
                    "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-black transition-all",
                    isActive
                      ? "shadow-lg"
                      : "bg-zinc-900/50 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                  )}
                  style={
                    isActive
                      ? {
                          backgroundColor: `${info.color}15`,
                          color: info.color,
                        }
                      : undefined
                  }
                  aria-pressed={isActive}
                >
                  {t}
                  <span className="font-bold tracking-normal">
                    {TIER_WORDS[t]}
                  </span>
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
              {visibleGenres.map((g) => {
                const isActive = activeGenre === g;
                return (
                  <button
                    key={g}
                    onClick={() => setActiveGenre(isActive ? null : g)}
                    aria-pressed={isActive}
                    className={cn(
                      "px-3 py-1 rounded-md text-[10px] font-bold capitalize transition-all",
                      isActive
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "bg-zinc-900/50 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                    )}
                  >
                    {g}
                  </button>
                );
              })}
              {!showAllGenres && !activeGenre && genres.length > GENRES_BEFORE_FOLD && (
                <button
                  onClick={() => setShowAllGenres(true)}
                  className="px-3 py-1 rounded-md bg-zinc-900/50 text-[10px] font-bold text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
                >
                  More genres ({genres.length - GENRES_BEFORE_FOLD})
                </button>
              )}
              {hasActiveFilter && (
                <button
                  onClick={() => {
                    setActiveTier(null);
                    setActiveGenre(null);
                    setQuery("");
                  }}
                  className="ml-1 px-3 py-1 rounded-md text-[10px] font-bold text-zinc-500 transition-colors hover:text-white"
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
              <PublicSongCard
                key={song.id}
                song={song}
                guideSlug={guideSlugBySongId[song.id]}
              />
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
