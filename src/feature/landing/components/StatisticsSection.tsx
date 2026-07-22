"use client";

import { cn } from "assets/lib/utils";
import { AuroraGlowFrame } from "components/AuroraGlowFrame/AuroraGlowFrame";
import { BarChart2, Clock, Star, TrendingUp, Users } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const LEGEND_CLASSES = [
  "bg-[#3f3f46]/30",
  "bg-cyan-200",
  "bg-cyan-300",
  "bg-cyan-400",
  "bg-cyan-500",
  "bg-cyan-600",
];

const LEVEL_CLASSES = [
  "bg-[#3f3f46]/30",
  "bg-cyan-200",
  "bg-cyan-300",
  "bg-cyan-400",
  "bg-cyan-500",
  "bg-cyan-600",
];

const ActivityHeatmap = () => {
  const data = useMemo(
    () =>
      Array.from({ length: 52 }).map(() =>
        Array.from({ length: 7 }).map(() =>
          Math.random() > 0.65 ? Math.floor(Math.random() * 5) + 1 : 0,
        ),
      ),
    [],
  );

  return (
    <div className='rounded-lg bg-zinc-800/60 px-4 py-3'>
      <div className='mb-3 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='text-[10px] font-bold text-zinc-400'>
            Practice activity
          </div>
          <div className='text-[10px] font-bold text-white'>263 sessions</div>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-[9px] font-bold text-zinc-400'>Less</span>
          <div className='flex gap-[3px]'>
            {LEGEND_CLASSES.map((cls, i) => (
              <div
                key={i}
                className={cn("h-[9px] w-[9px] rounded-[2px]", cls)}
              />
            ))}
          </div>
          <span className='text-[9px] font-bold text-zinc-400'>More</span>
        </div>
      </div>

      {/* Month labels */}
      <div className='mb-1 flex gap-[3px] pl-6'>
        {MONTHS.map((m) => (
          <div
            key={m}
            className='w-[52px] min-w-0 text-[8px] font-bold text-zinc-400'>
            {m}
          </div>
        ))}
      </div>

      <div className='flex items-start gap-1.5 overflow-x-auto'>
        {/* Day labels */}
        <div className='flex h-[84px] shrink-0 flex-col justify-between pt-[1px] text-[8px] font-bold text-zinc-400'>
          <span>M</span>
          <span>T</span>
          <span>S</span>
        </div>

        {/* Grid */}
        <div className='flex gap-[3px]'>
          {data.map((week, i) => (
            <div key={i} className='flex shrink-0 flex-col gap-[3px]'>
              {week.map((level, j) => (
                <div
                  key={j}
                  title={
                    level > 0
                      ? `${level} session${level > 1 ? "s" : ""}`
                      : "No activity"
                  }
                  className={cn(
                    "h-[9px] w-[9px] rounded-[2px] transition-opacity hover:opacity-80",
                    LEVEL_CLASSES[level],
                  )}
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
    icon: <Clock className='h-4 w-4' />,
    label: "Total practice time",
    desc: "Every session logged, down to the hour",
  },
  {
    icon: <BarChart2 className='h-4 w-4' />,
    label: "Skill breakdown",
    desc: "Technique, Theory, Creativity, Ear Training",
  },
  {
    icon: <Star className='h-4 w-4' />,
    label: "Points & milestones",
    desc: "Earn XP and climb the leaderboard",
  },
  {
    icon: <TrendingUp className='h-4 w-4' />,
    label: "Long-term trends",
    desc: "Spot plateaus and breakthroughs over time",
  },
];

export const StatisticsSection = () => {
  return (
    <section className='relative overflow-hidden bg-zinc-900 py-24'>
      {/* Background ambience */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute left-0 top-1/4 h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[150px]' />
        <div className='absolute bottom-0 right-1/3 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.04] blur-[130px]' />
      </div>

      <div className='relative z-10 mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='grid grid-cols-1 items-start gap-12 lg:grid-cols-[1.7fr_1fr] xl:gap-16'>
          {/* Left - screenshot + heatmap */}
          <div className='order-2 flex flex-col gap-4 lg:order-1'>
            <AuroraGlowFrame>
              <div className='relative rounded-lg p-1.5 glass-card'>
                <div className='relative overflow-hidden rounded-lg'>
                  <Image
                    src='/images/feature/statistics.webp'
                    alt='Detailed practice statistics dashboard with skill breakdowns'
                    width={1100}
                    height={460}
                    className='h-auto w-full object-cover'
                    priority={false}
                  />
                  <div className='pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-r from-transparent to-zinc-900/40' />
                </div>
              </div>

              {/* Floating badge */}
              <div className='absolute -bottom-4 -left-4 flex items-center gap-2 rounded-lg bg-zinc-800/70 px-4 py-2.5'>
                <Users className='h-3.5 w-3.5 text-cyan-400' />
                <span className='text-[11px] font-bold text-white'>
                  Your progress
                </span>
              </div>
            </AuroraGlowFrame>

            {/* Heatmap below image */}
            <ActivityHeatmap />
          </div>

          {/* Right - content */}
          <div className='order-1 flex flex-col lg:order-2'>
            <span className='mb-6 text-sm font-bold tracking-wide text-cyan-400'>
              Progress tracking
            </span>

            <h2 className='mb-6 font-landingHeading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl'>
              Numbers don’t lie. <br />
              <span className='text-zinc-400'>Your data does the talking.</span>
            </h2>

            <p className='mb-8 max-w-md text-lg leading-relaxed text-zinc-400'>
              A stats dashboard that breaks every hour into meaningful
              categories, so you know where your time actually goes.
            </p>

            {/* Feature list */}
            <ul className='space-y-5'>
              {features.map((f, i) => (
                <li key={i} className='flex items-start gap-4'>
                  <div className='mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400'>
                    {f.icon}
                  </div>
                  <div>
                    <div className='mb-0.5 text-sm font-bold text-white'>
                      {f.label}
                    </div>
                    <div className='text-sm leading-relaxed text-zinc-400'>
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
