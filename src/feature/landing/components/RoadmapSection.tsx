"use client";

import { cn } from "assets/lib/utils";
import { ArrowRight, Play, Target } from "lucide-react";

const GOAL_TAGS = ["Shred Speed", "Fingerpicking", "Music Theory", "Improvisation", "Sweep Picking"];

const ROADMAP_STEPS = [
  {
    level: "Week 1–2",
    title: "Chromatic warm-up",
    type: "Technique",
    color: "cyan",
    done: true,
  },
  {
    level: "Week 3–4",
    title: "Spider exercise — positions",
    type: "Technique",
    color: "cyan",
    done: true,
  },
  {
    level: "Week 5–6",
    title: "Pentatonic patterns",
    type: "Creativity",
    color: "amber",
    done: false,
    active: true,
  },
  {
    level: "Week 7–8",
    title: "String skipping drill",
    type: "Technique",
    color: "cyan",
    done: false,
  },
  {
    level: "Week 9+",
    title: "Full solo integration",
    type: "Creativity",
    color: "amber",
    done: false,
  },
];

const colorMap: Record<string, string> = {
  cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
  amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
};

export const RoadmapSection = () => {
  return (
    <section className="relative py-32 bg-zinc-950 overflow-hidden">
      {/* Background ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-cyan-500/5 blur-[160px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-500/4 blur-[130px] rounded-full" />
      </div>

      {/* Top divider */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-start">

          {/* Left — content */}
          <div className="flex flex-col lg:sticky lg:top-24">
            <span className="text-sm font-black uppercase tracking-[0.3em] text-cyan-400 mb-6">
              Guided Roadmap
            </span>

            <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-tight font-display mb-6">
              Pick your goal. <br />
              <span className="text-zinc-500">We map the path.</span>
            </h2>

            <p className="text-zinc-400 text-lg leading-relaxed mb-8 max-w-md">
              Tell the app what you want to achieve. It builds a week-by-week
              exercise roadmap with the right drills in the right order — each
              one linked to a curated YouTube lesson so you know exactly how
              to execute it.
            </p>

            {/* Goal selector mock */}
            <div className="mb-10">
              <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Your goal</div>
              <div className="flex flex-wrap gap-2">
                {GOAL_TAGS.map((tag, i) => (
                  <div
                    key={tag}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider border transition-colors cursor-default",
                      i === 0
                        ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                        : "bg-zinc-900/60 border-white/5 text-zinc-600"
                    )}
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right — roadmap visual */}
          <div className="relative flex flex-col gap-3">
            {ROADMAP_STEPS.map((step, i) => (
              <div key={i} className="relative flex gap-4">
                {/* Timeline line */}
                {i < ROADMAP_STEPS.length - 1 && (
                  <div className="absolute left-[15px] top-[32px] w-[2px] h-[calc(100%+12px)] bg-gradient-to-b from-zinc-700/40 to-transparent" />
                )}

                {/* Dot */}
                <div className={cn(
                  "relative z-10 mt-1 w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                  step.done
                    ? "bg-emerald-500/20 border-emerald-500/50"
                    : step.active
                    ? "bg-cyan-500/20 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                    : "bg-zinc-900 border-zinc-700/50"
                )}>
                  {step.done ? (
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : step.active ? (
                    <Play className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-zinc-700" />
                  )}
                </div>

                {/* Card */}
                <div className={cn(
                  "flex-1 rounded-xl border p-4 transition-all",
                  step.active
                    ? "border-cyan-500/30 bg-cyan-500/5"
                    : step.done
                    ? "border-white/5 bg-zinc-900/30 opacity-60"
                    : "border-white/5 bg-zinc-900/40"
                )}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">{step.level}</div>
                      <div className={cn(
                        "text-sm font-bold tracking-tight",
                        step.active ? "text-white" : step.done ? "text-zinc-400" : "text-zinc-300"
                      )}>
                        {step.title}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border", colorMap[step.color])}>
                        {step.type}
                      </span>
                    </div>
                  </div>
                  {step.active && (
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                      <span>Continue</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Bottom unlock hint */}
            <div className="ml-12 mt-2 flex items-center gap-2 text-[10px] font-bold text-zinc-600">
              <Target className="w-3.5 h-3.5" />
              <span>Complete each stage to unlock the next</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
