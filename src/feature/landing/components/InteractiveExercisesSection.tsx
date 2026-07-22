"use client";

import { Guitar, ListMusic, Star } from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: <ListMusic className="w-4 h-4" />,
    label: "144 exercises built in",
    desc: "Ready-to-play technical drills, from finger warm-ups and legato to alternate picking and advanced shred techniques",
  },
  {
    icon: <Guitar className="w-4 h-4" />,
    label: "Guitar Pro files",
    desc: "Import any GP file and practice with color-coded tablature synced to audio playback",
  },
  {
    icon: <Star className="w-4 h-4" />,
    label: "Guitar Hero on a real guitar",
    desc: "Earn points for every exercise you complete, the same dopamine hit, but you're actually building a real skill",
  },
];

export const InteractiveExercisesSection = () => {
  return (
    <section className="relative py-28 bg-zinc-950 overflow-hidden">
      {/* Background ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-0 w-[700px] h-[700px] bg-cyan-500/5 blur-[160px] rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-sky-500/5 blur-[130px] rounded-full" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.7fr] gap-12 xl:gap-16 items-center">

          {/* Left - content */}
          <div className="flex flex-col">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-tight font-display mb-6">
              Practice with tabs. <br />
              <span className="text-zinc-500">Hear every note.</span>
            </h2>

            <p className="text-zinc-400 text-lg leading-relaxed mb-12 max-w-md">
              144 technical exercises with animated GP tablature. See exactly what to play, hear how it sounds, and slow down to any tempo you need.
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
            <div className="absolute inset-0 -m-8 bg-[radial-gradient(circle,rgba(6,182,212,0.12),transparent_70%)] blur-2xl pointer-events-none" />

            <div className="relative rounded-lg glass-card p-1.5">
              <div className="relative overflow-hidden rounded-lg">
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
            <div className="absolute -bottom-4 -right-4 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-bold text-white">
                Live sync
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
