"use client";

import { Layers, PenLine, Shuffle, Timer } from "lucide-react";
import Image from "next/image";

export const PracticePlansSection = () => {
  return (
    <section className="relative py-28 bg-zinc-950 overflow-hidden">
      {/* Background ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-0 w-[600px] h-[600px] bg-amber-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-500/4 blur-[130px] rounded-full" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl mb-14">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-tight font-display mb-6">
            Your practice, <br />
            <span className="text-zinc-500">your rules.</span>
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
            Stop improvising your sessions. Build structured practice plans
            from scratch or pick a ready-made template, then execute with
            focus and track every minute of it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {/* Featured tile: real screenshot */}
          <div className="md:col-span-3 md:row-span-2 rounded-lg glass-card p-1.5 flex flex-col">
            <div className="relative overflow-hidden rounded-lg flex-1">
              <Image
                src="/images/feature/practices-plans.webp"
                alt="Practice plans library with custom and template routines"
                width={1200}
                height={800}
                className="w-full h-auto object-cover"
                priority={false}
              />
            </div>
            <div className="flex items-start gap-4 p-5">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                <PenLine className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-white mb-0.5">Build your own plan</div>
                <div className="text-sm text-zinc-500 leading-relaxed">
                  Create a fully custom routine from scratch, pick exercises, set durations, define order
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 rounded-lg bg-zinc-900/40 p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white mb-0.5">Ready-made templates</div>
              <div className="text-sm text-zinc-500 leading-relaxed">
                Curated plans for technique, theory, creativity, and ear training
              </div>
            </div>
          </div>

          <div className="md:col-span-2 rounded-lg bg-zinc-900/40 p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white mb-0.5">Timed sessions</div>
              <div className="text-sm text-zinc-500 leading-relaxed">
                Each block has a fixed time slot so your practice stays focused and on schedule
              </div>
            </div>
          </div>

          <div className="md:col-span-5 rounded-lg bg-amber-500/10 p-6 flex items-center gap-5">
            <div className="w-11 h-11 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0">
              <Shuffle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-white mb-0.5">Auto-plan</div>
              <div className="text-sm text-zinc-400 leading-relaxed">
                One click generates a ready-to-go session based on your stats, no planning needed, just pick up and play
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
