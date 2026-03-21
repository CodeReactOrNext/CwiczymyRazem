"use client";

import Link from "next/link";
import { Check, Minus } from "lucide-react";

const FEATURES: { label: string; pro: boolean; master: boolean }[] = [
  { label: "Real-time Note Detection",   pro: true,  master: true  },
  { label: "Practice Plan Creator",      pro: true,  master: true  },
  { label: "Practice Calendar",          pro: true,  master: true  },
  { label: "Guitar Pro File Support",    pro: true,  master: true  },
  { label: "Full Exercise Library",      pro: true,  master: true  },
  { label: "Special Ranks",             pro: true,  master: true  },
  { label: "Skill Roadmaps",            pro: false, master: true  },
  { label: "Daily Practice Insights",   pro: false, master: true  },
  { label: "Weekly Progress Summary",   pro: false, master: true  },
  { label: "Goal-based Analytics",      pro: false, master: true  },
];

export const PricingSection = () => {
  return (
    <section className="py-32 bg-zinc-950 relative overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:72px_72px] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />

      <div className="mx-auto max-w-5xl px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">Pricing</p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Simple, transparent pricing.
          </h2>

        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-800 rounded-2xl overflow-hidden mb-6 shadow-2xl">

          {/* Practice Pro */}
          <div className="bg-zinc-900 p-8 flex flex-col">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">🎸 Practice Pro</p>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-5xl font-bold text-white tracking-tight">€4.99</span>
                <span className="text-zinc-500 mb-1.5">/ month</span>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Essential tools to organize and improve your daily guitar practice.
              </p>
            </div>

            <ul className="flex flex-col gap-3 flex-1 mb-8">
              {FEATURES.filter(f => f.pro).map((f, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check size={14} className="text-zinc-400 shrink-0" />
                  <span className="text-sm text-zinc-300">{f.label}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/premium"
              className="block text-center rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors"
            >
              Get started →
            </Link>
          </div>

          {/* Practice Master */}
          <div className="bg-zinc-900 p-8 flex flex-col relative">
            {/* Top accent line */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">🏆 Practice Master</p>
                <span className="text-[10px] font-bold uppercase tracking-widest border border-white/20 text-white/70 rounded px-2 py-0.5">
                  Most Popular
                </span>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-5xl font-bold text-white tracking-tight">€7.99</span>
                <span className="text-zinc-500 mb-1.5">/ month</span>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Everything in Practice Pro, plus advanced tools to track your progress and reach your goals faster.
              </p>
            </div>

            <ul className="flex flex-col gap-3 flex-1 mb-8">
              {FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-3">
                  {f.master ? (
                    <Check size={14} className={`shrink-0 ${f.pro ? "text-zinc-400" : "text-white"}`} />
                  ) : (
                    <Minus size={14} className="text-zinc-700 shrink-0" />
                  )}
                  <span className={`text-sm ${f.master && !f.pro ? "text-white font-medium" : "text-zinc-300"}`}>
                    {f.label}
                  </span>
                  {!f.pro && f.master && (
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-zinc-500 border border-zinc-700 rounded px-1.5 py-0.5">
                      Master
                    </span>
                  )}
                </li>
              ))}
            </ul>

            <Link
              href="/premium"
              className="block text-center rounded-lg bg-white hover:bg-zinc-100 px-6 py-3 text-sm font-bold text-black transition-colors"
            >
              Get started →
            </Link>
          </div>
        </div>

     

      </div>
    </section>
  );
};
