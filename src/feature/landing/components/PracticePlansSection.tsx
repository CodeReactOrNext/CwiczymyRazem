"use client";

import { ClipboardList, Layers, PenLine, Shuffle, Timer } from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: <PenLine className="w-4 h-4" />,
    label: "Build your own plan",
    desc: "Create a fully custom routine from scratch — pick exercises, set durations, define order",
  },
  {
    icon: <Layers className="w-4 h-4" />,
    label: "Ready-made templates",
    desc: "Start from curated plans for technique, theory, creativity, and ear training",
  },
  {
    icon: <Timer className="w-4 h-4" />,
    label: "Timed sessions",
    desc: "Each block has a fixed time slot so your practice stays focused and on schedule",
  },
  {
    icon: <Shuffle className="w-4 h-4" />,
    label: "Auto-plan",
    desc: "One click generates a ready-to-go session based on your stats — no planning needed, just pick up and play",
  },
];

export const PracticePlansSection = () => {
  return (
    <section className="relative py-32 bg-zinc-950 overflow-hidden">
      {/* Background ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-0 w-[600px] h-[600px] bg-amber-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-500/4 blur-[130px] rounded-full" />
      </div>

      {/* Top divider */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-12 xl:gap-16 items-center">

          {/* Left — screenshot */}
          <div className="relative order-2 lg:order-1">
            {/* Outer glow */}
            <div className="absolute inset-0 -m-8 bg-gradient-radial from-amber-500/8 via-transparent to-transparent blur-2xl pointer-events-none" />

            {/* App chrome frame */}
            <div className="relative rounded-2xl border border-white/10 bg-zinc-900/60 p-1.5 shadow-2xl backdrop-blur-sm">
              {/* Fake title bar */}
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                <div className="flex-1 mx-4 h-4 rounded bg-zinc-800/60 max-w-[180px]" />
                <div className="flex items-center gap-1.5">
                  <ClipboardList className="w-3 h-3 text-zinc-600" />
                  <span className="text-[9px] font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded uppercase tracking-widest">My Plans</span>
                </div>
              </div>

              {/* Screenshot */}
              <div className="relative overflow-hidden rounded-xl">
                <Image
                  src="/images/feature/practices-plans.webp"
                  alt="Practice plans library with custom and template routines"
                  width={1200}
                  height={800}
                  className="w-full h-auto object-cover"
                  priority={false}
                />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-900/60 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 shadow-xl">
              <PenLine className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-black text-white uppercase tracking-widest">
                Your routine
              </span>
            </div>
          </div>

          {/* Right — content */}
          <div className="flex flex-col order-1 lg:order-2">
            <span className="text-sm font-black uppercase tracking-[0.3em] text-amber-400 mb-6">
              Practice Plans
            </span>

            <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-tight font-display mb-6">
              Your practice, <br />
              <span className="text-zinc-500">your rules.</span>
            </h2>

            <p className="text-zinc-400 text-lg leading-relaxed mb-12 max-w-md">
              Stop improvising your sessions. Build structured practice plans
              from scratch or pick a ready-made template — then execute with
              focus and track every minute of it.
            </p>

            {/* Feature list */}
            <ul className="space-y-5">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-4 group">
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 transition-colors group-hover:bg-amber-500/20">
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

        </div>
      </div>
    </section>
  );
};
