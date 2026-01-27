"use client";

import { BarChart3, Heart,Star } from "lucide-react";

const points = [
  {
    title: "Progress You Can See",
    description: "Most guitarists quit because they don’t see progress. Riff Quest makes every session visible and rewarding.",
    icon: Star,
    color: "text-amber-400",
    bg: "bg-amber-400/10"
  },
  {
    title: "No More Guesswork",
    description: "Picked up your guitar but don't know what to play? Our community-rated song difficulty helps you pick the right challenge.",
    icon: BarChart3,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10"
  },
  {
    title: "Zero Streak Pressure",
    description: "Life happens. We track your long-term growth, not just how many days in a row you practiced. No stress, just guitar.",
    icon: Heart,
    color: "text-rose-400",
    bg: "bg-rose-400/10"
  }
];

export const WhySection = () => {
  return (
    <section className="py-24 bg-[#0d0d0c] border-y border-white/5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Why guitarists use Riff Quest
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {points.map((point, index) => (
            <div key={index} className="flex flex-col items-center text-center group">
              <div className={`w-16 h-16 rounded-2xl ${point.bg} flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform duration-300`}>
                <point.icon className={`w-8 h-8 ${point.color}`} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{point.title}</h3>
              <p className="text-zinc-400 leading-relaxed">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
