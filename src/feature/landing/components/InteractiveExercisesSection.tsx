"use client";

import { Guitar, ListMusic, Star } from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: <ListMusic className="w-4 h-4" />,
    label: "144 exercises built in",
    desc: "Ready-to-play technical drills — from finger warm-ups and legato to alternate picking and advanced shred techniques",
  },
  {
    icon: <Guitar className="w-4 h-4" />,
    label: "Guitar Pro files",
    desc: "Import any GP file and practice with color-coded tablature synced to audio playback",
  },
  {
    icon: <Star className="w-4 h-4" />,
    label: "Guitar Hero on a real guitar",
    desc: "Earn points for every exercise you complete — the same dopamine hit, but you're actually building a real skill",
  },
];

export const InteractiveExercisesSection = () => {
  return (
    <section className="relative py-32 bg-zinc-950 overflow-hidden">
      {/* Background ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-0 w-[700px] h-[700px] bg-cyan-500/5 blur-[160px] rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-sky-500/5 blur-[130px] rounded-full" />
      </div>

      {/* Top divider */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.7fr] gap-12 xl:gap-16 items-center">

          {/* Left — content */}
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-[0.3em] text-cyan-400 mb-6">
              Interactive Exercises
            </span>

            <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-tight font-display mb-6">
              Practice with tabs. <br />
              <span className="text-zinc-500">Hear every note.</span>
            </h2>

            <p className="text-zinc-400 text-lg leading-relaxed mb-12 max-w-md">
              144 technical exercises with animated GP tablature — see exactly what to play, hear how it sounds, and slow down to any tempo you need.
            </p>

            {/* Feature list */}
            <ul className="space-y-5">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-4 group">
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 transition-colors group-hover:bg-cyan-500/20">
                    {f.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white uppercase tracking-wide mb-0.5">
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

          {/* Right — screenshot */}
          <div className="relative">
            {/* Outer glow */}
            <div className="absolute inset-0 -m-8 bg-gradient-radial from-cyan-500/10 via-transparent to-transparent blur-2xl pointer-events-none" />

            {/* App chrome frame */}
            <div className="relative rounded-2xl border border-white/10 bg-zinc-900/60 p-1.5 shadow-2xl backdrop-blur-sm">
              {/* Fake title bar */}
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                <div className="flex-1 mx-4 h-4 rounded bg-zinc-800/60 max-w-[200px]" />
              </div>

              {/* Screenshot */}
              <div className="relative overflow-hidden rounded-xl mt-0">
                <Image
                  src="/images/feature/tabs.webp"
                  alt="Interactive Guitar Pro tablature with animated playback"
                  width={1400}
                  height={350}
                  className="w-full h-auto object-cover"
                  priority={false}
                />
                <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-zinc-900/60 pointer-events-none" />
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -right-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 shadow-xl">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-black text-white uppercase tracking-widest">
                Live Sync
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
