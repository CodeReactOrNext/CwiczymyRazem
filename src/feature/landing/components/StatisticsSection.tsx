"use client";

import { cn } from "assets/lib/utils";
import { BarChart2, Clock, Star, TrendingUp, Users } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const LEGEND_CLASSES = [
  "bg-[#3f3f46]/30",
  "bg-amber-200",
  "bg-amber-300",
  "bg-amber-400",
  "bg-amber-500",
  "bg-amber-600",
];

const LEVEL_CLASSES = ["bg-[#3f3f46]/30", "bg-amber-200", "bg-amber-300", "bg-amber-400", "bg-amber-500", "bg-amber-600"];

const ActivityHeatmap = () => {
  const data = useMemo(() =>
    Array.from({ length: 52 }).map(() =>
      Array.from({ length: 7 }).map(() =>
        Math.random() > 0.65 ? Math.floor(Math.random() * 5) + 1 : 0
      )
    ), []
  );

  return (
    <div className="rounded-xl border border-white/5 bg-zinc-900/40 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">Practice Activity</div>
          <div className="text-[10px] font-bold text-white">263 sessions</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-zinc-700 uppercase">Less</span>
          <div className="flex gap-[3px]">
            {LEGEND_CLASSES.map((cls, i) => (
              <div key={i} className={cn("w-[9px] h-[9px] rounded-[2px]", cls)} />
            ))}
          </div>
          <span className="text-[9px] font-bold text-zinc-700 uppercase">More</span>
        </div>
      </div>

      {/* Month labels */}
      <div className="flex gap-[3px] mb-1 pl-6">
        {MONTHS.map((m) => (
          <div key={m} className="w-[52px] min-w-0 text-[8px] font-bold text-zinc-700">
            {m}
          </div>
        ))}
      </div>

      <div className="flex items-start gap-1.5 overflow-x-auto">
        {/* Day labels */}
        <div className="flex flex-col justify-between text-[8px] font-bold text-zinc-700 shrink-0 pt-[1px] h-[84px]">
          <span>M</span>
          <span>T</span>
          <span>S</span>
        </div>

        {/* Grid */}
        <div className="flex gap-[3px]">
          {data.map((week, i) => (
            <div key={i} className="flex flex-col gap-[3px] shrink-0">
              {week.map((level, j) => (
                <div
                  key={j}
                  title={level > 0 ? `${level} session${level > 1 ? "s" : ""}` : "No activity"}
                  className={cn("w-[9px] h-[9px] rounded-[2px] transition-opacity hover:opacity-80", LEVEL_CLASSES[level])}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const features = [
  {
    icon: <Clock className="w-4 h-4" />,
    label: "Total practice time",
    desc: "Every session logged — see exactly how many hours you've invested in your craft",
  },
  {
    icon: <BarChart2 className="w-4 h-4" />,
    label: "Skill breakdown",
    desc: "Track time spent on Technique, Theory, Creativity, and Ear Training separately",
  },
  {
    icon: <Star className="w-4 h-4" />,
    label: "Points & milestones",
    desc: "Earn XP for every session and watch your rank climb the leaderboard",
  },
  {
    icon: <TrendingUp className="w-4 h-4" />,
    label: "Long-term trends",
    desc: "Spot patterns, plateau moments, and breakthroughs across months and years",
  },
];

export const StatisticsSection = () => {
  return (
    <section className="relative py-32 bg-zinc-950 overflow-hidden">
      {/* Background ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-amber-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-orange-500/4 blur-[130px] rounded-full" />
      </div>

      {/* Top divider */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-12 xl:gap-16 items-start">

          {/* Left — screenshot + heatmap */}
          <div className="flex flex-col gap-4 order-2 lg:order-1">
            {/* Chrome frame wrapper */}
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute inset-0 -m-8 bg-gradient-radial from-amber-500/8 via-transparent to-transparent blur-2xl pointer-events-none" />

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
                <div className="relative overflow-hidden rounded-xl">
                  <Image
                    src="/images/feature/statistics.webp"
                    alt="Detailed practice statistics dashboard with skill breakdowns"
                    width={1100}
                    height={460}
                    className="w-full h-auto object-cover"
                    priority={false}
                  />
                  <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-r from-transparent to-zinc-900/40 pointer-events-none" />
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 shadow-xl">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-black text-white uppercase tracking-widest">
                  Your progress
                </span>
              </div>
            </div>

            {/* Heatmap below image */}
            <div className="mt-6">
              <ActivityHeatmap />
            </div>
          </div>

          {/* Right — content */}
          <div className="flex flex-col order-1 lg:order-2">
            <span className="text-sm font-black uppercase tracking-[0.3em] text-amber-400 mb-6">
              Progress Tracking
            </span>

            <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-tight font-display mb-6">
              Numbers don't lie. <br />
              <span className="text-zinc-500">Your data does the talking.</span>
            </h2>

            <p className="text-zinc-400 text-lg leading-relaxed mb-12 max-w-md">
              A detailed stats dashboard that breaks down every hour of practice
              into meaningful categories. Know exactly where your time goes and
              where to invest it next.
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
