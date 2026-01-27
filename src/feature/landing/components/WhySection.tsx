"use client";

import { BarChart3, Heart, Star } from "lucide-react";
import { motion } from "framer-motion";

const points = [
  {
    title: "Progress You Can See",
    description: "Most guitarists quit because they don’t see progress. Riff Quest makes every session visible and rewarding.",
    icon: Star,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10"
  },
  {
    title: "No More Guesswork",
    description: "Picked up your guitar but don't know what to play? Our community-rated song difficulty helps you pick the right challenge.",
    icon: BarChart3,
    color: "text-teal-400",
    bg: "bg-teal-400/10"
  },
  {
    title: "Zero Streak Pressure",
    description: "Life happens. We track your long-term growth, not just how many days in a row you practiced. No stress, just guitar.",
    icon: Heart,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10"
  }
];

export const WhySection = () => {
  const grainOverlay = "before:content-[''] before:absolute before:inset-0 before:opacity-[0.03] before:pointer-events-none before:bg-[url('/static/images/old_effect_dark.webp')] before:z-50";

  return (
    <section className={`py-32 bg-zinc-950 relative overflow-hidden ${grainOverlay}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-tight font-display"
          >
            Designed for the <br /> 
            <span className="text-zinc-600">modern guitarist.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 lg:gap-24">
          {points.map((point, index) => (
            <motion.div 
                key={index} 
                className="flex flex-col group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
            >
              <div className="mb-8 relative">
                 <div className={`absolute inset-0 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${point.bg} rounded-full`}></div>
                 <point.icon className={`w-12 h-12 relative z-10 ${point.color} transition-transform duration-500 group-hover:scale-110`} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-6 tracking-tight">{point.title}</h3>
              <p className="text-zinc-500 leading-relaxed text-lg font-medium">
                {point.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
