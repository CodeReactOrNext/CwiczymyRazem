"use client";

import { BookMarked, Disc3, Filter, Sliders, Star } from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: <Disc3 className="w-4 h-4" />,
    label: "Thousands of songs",
    desc: "A growing community-curated library spanning every genre and difficulty level",
  },
  {
    icon: <Star className="w-4 h-4" />,
    label: "Community difficulty ratings",
    desc: "Real scores from guitarists who actually practiced the song, no guesswork",
  },
  {
    icon: <Filter className="w-4 h-4" />,
    label: "Smart filtering",
    desc: "Browse by genre, difficulty, technique type, or your current skill level",
  },
  {
    icon: <BookMarked className="w-4 h-4" />,
    label: "Want to learn list",
    desc: "Save songs to your queue and turn your wishlist into a structured practice plan",
  },
];

export const SongsLibrarySection = () => {
  return (
    <section className="relative py-28 bg-zinc-950 overflow-hidden">
      {/* Background ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[700px] h-[700px] bg-cyan-500/5 blur-[160px] rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-sky-500/4 blur-[120px] rounded-full" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.7fr] gap-12 xl:gap-16 items-center">

          {/* Left - content */}
          <div className="flex flex-col">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-tight font-display mb-6">
              Every song you want <br />
              <span className="text-zinc-500">to learn. Ranked.</span>
            </h2>

            <p className="text-zinc-400 text-lg leading-relaxed mb-12 max-w-md">
              Browse a massive library rated by the community, not algorithms.
              Find songs that match exactly where you are right now, add them to
              your queue, and start learning with context.
            </p>

            {/* Feature list */}
            <ul className="space-y-5">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="mt-0.5 w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white mb-0.5">
                      {f.label}
                    </div>
                    <div className="text-sm text-zinc-500 leading-relaxed">
                      {f.desc}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Right - screenshot */}
          <div className="relative">
            <div className="absolute inset-0 -m-8 bg-[radial-gradient(circle,rgba(6,182,212,0.1),transparent_70%)] blur-2xl pointer-events-none" />

            <div className="relative rounded-lg glass-card p-1.5">
              <div className="flex items-center gap-1.5 px-3 py-2">
                <Sliders className="w-3 h-3 text-zinc-600" />
                <span className="text-[9px] font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">Difficulty under 6</span>
              </div>

              <div className="relative overflow-hidden rounded-lg">
                <Image
                  src="/images/feature/songs.webp"
                  alt="Song library with community difficulty ratings and genre filters"
                  width={900}
                  height={700}
                  className="w-full h-auto object-cover"
                  priority={false}
                />
                {/* Bottom fade */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-zinc-900/70 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -right-4 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900">
              <span className="text-[11px] font-bold text-cyan-400">
                Community rated
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
