"use client";

import { Music, Star, Users } from "lucide-react";

interface LibraryStatsBarProps {
  totalSongs: number;
}

const stats = [
  { icon: <Music className="h-4 w-4" />, label: "Songs", dynamic: true },
  { icon: <Star className="h-4 w-4" />, label: "Community Rated", dynamic: false },
  { icon: <Users className="h-4 w-4" />, label: "6 Difficulty Tiers", dynamic: false },
];

export const LibraryStatsBar = ({ totalSongs }: LibraryStatsBarProps) => {
  return (
    <div className="bg-zinc-900/40 border-y border-white/5 py-4">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-2.5 text-zinc-400">
              <span className="text-cyan-500">{stat.icon}</span>
              <span className="text-sm font-bold">
                {stat.dynamic && totalSongs > 0 ? `${totalSongs}+ ` : ""}
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
