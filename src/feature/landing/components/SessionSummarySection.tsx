"use client";

import { Brain, Sparkles, TrendingUp } from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: <Brain className="w-4 h-4" />,
    label: "AI session assessment",
    desc: "Every session gets a grade with a written breakdown of your strengths and blind spots",
  },
  {
    icon: <Sparkles className="w-4 h-4" />,
    label: "Personalized feedback",
    desc: "Not generic tips, feedback based on what you actually practiced that day",
  },
  {
    icon: <TrendingUp className="w-4 h-4" />,
    label: "Points & level progression",
    desc: "Earn XP for each session and watch your level climb in real time",
  },
];

export const SessionSummarySection = () => {
  return (
    <section className="relative py-28 bg-zinc-900/20 overflow-hidden">
      {/* Background ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-amber-500/5 blur-[150px] rounded-full" />
      </div>

      <div className="mx-auto max-w-5xl px-6 lg:px-8 relative z-10 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-tight font-display mb-6">
          End every session <br />
          <span className="text-zinc-500">knowing what’s next.</span>
        </h2>

        <p className="text-zinc-400 text-lg leading-relaxed mb-14 max-w-xl mx-auto">
          After each practice, the AI grades your session, highlights your
          strengths, and tells you exactly what to focus on next time. No more
          guessing, just clear, actionable direction.
        </p>

        <div className="relative max-w-3xl mx-auto mb-16">
          <div className="absolute inset-0 -m-8 bg-[radial-gradient(circle,rgba(245,158,11,0.1),transparent_70%)] blur-2xl pointer-events-none" />

          <div className="relative rounded-lg glass-card p-1.5">
            <div className="relative overflow-hidden rounded-lg">
              <Image
                src="/images/feature/summary.webp"
                alt="AI-powered session summary with grade, strengths and improvement tips"
                width={1040}
                height={680}
                className="w-full h-auto object-cover"
                priority={false}
              />
            </div>
          </div>

          {/* Floating grade badge */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-zinc-900">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-[13px] font-bold text-emerald-400">A-</span>
            </div>
            <div className="text-left">
              <div className="text-[11px] font-bold text-white">Creative flow</div>
              <div className="text-[10px] font-medium text-zinc-500">Today’s assessment</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-10 sm:gap-8 text-left rounded-lg bg-zinc-900/40 p-8">
          {features.map((f, i) => (
            <div key={i} className="flex-1 flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                {f.icon}
              </div>
              <div>
                <div className="text-sm font-bold text-white mb-1">{f.label}</div>
                <div className="text-sm text-zinc-500 leading-relaxed">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
