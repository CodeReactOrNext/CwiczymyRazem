import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Lock, CheckCircle2, ChevronRight,
  Guitar, Drum, Music2, Mic2,
} from "lucide-react";
import Image from "next/image";
import type { JourneyModuleWithStatus, LockedModulePlaceholder } from "../../types/journey.types";

// ─── Config ───────────────────────────────────────────────────────────────────

const MODULE_CFG: Record<string, {
  accent: string;
  accentRgb: string;
  border: string;
  badgeCls: string;
  heroBg: string;
  tag: string;
  tagline: string;
  image: string;
  icon: React.ReactNode;
}> = {
  fundamentals: {
    accent:    "text-cyan-400",
    accentRgb: "6,182,212",
    border:    "border-cyan-500/40",
    badgeCls:  "bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30",
    heroBg:    "from-cyan-950/70 via-zinc-900/60 to-zinc-900/0",
    tag:       "Start Here",
    tagline:   "The foundation every guitarist needs",
    image:     "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=1200&q=80",
    icon:      <Guitar size={20} />,
  },
  rhythm: {
    accent:    "text-amber-400",
    accentRgb: "245,158,11",
    border:    "border-amber-500/20",
    badgeCls:  "bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20",
    heroBg:    "from-amber-950/50 via-zinc-900/60 to-zinc-900/0",
    tag:       "Rhythm",
    tagline:   "Groove, syncopation & strumming patterns",
    image:     "/images/3d/metronom.png",
    icon:      <Drum size={20} />,
  },
  scales: {
    accent:    "text-violet-400",
    accentRgb: "139,92,246",
    border:    "border-violet-500/20",
    badgeCls:  "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20",
    heroBg:    "from-violet-950/50 via-zinc-900/60 to-zinc-900/0",
    tag:       "Theory",
    tagline:   "Pentatonic, minor, major and modes",
    image:     "/images/3d/skills.png",
    icon:      <Music2 size={20} />,
  },
  improvisation: {
    accent:    "text-rose-400",
    accentRgb: "244,63,94",
    border:    "border-rose-500/20",
    badgeCls:  "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20",
    heroBg:    "from-rose-950/50 via-zinc-900/60 to-zinc-900/0",
    tag:       "Expression",
    tagline:   "Phrasing, feel and improvisation",
    image:     "/images/3d/activity.png",
    icon:      <Mic2 size={20} />,
  },
};

// ─── Background decorations ───────────────────────────────────────────────────




const FloatingParticles = () => {
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, () => ({
        size:     Math.random() * 3 + 1,
        left:     Math.random() * 100,
        top:      Math.random() * 100,
        duration: Math.random() * 12 + 10,
        delay:    Math.random() * 15,
        yDest:    -100 - Math.random() * 80,
        xDest:    (Math.random() - 0.5) * 70,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width:  `${p.size}px`,
            height: `${p.size}px`,
            left:   `${p.left}%`,
            top:    `${p.top}%`,
            filter: "blur(1.5px)",
            background: i % 3 === 0 ? "rgba(6,182,212,0.5)" : i % 3 === 1 ? "rgba(245,158,11,0.3)" : "rgba(139,92,246,0.3)",
          }}
          animate={{ y: [0, p.yDest], x: [0, p.xDest], opacity: [0, 0.6, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "linear", delay: p.delay }}
        />
      ))}
    </div>
  );
};

// ─── Animation variants ───────────────────────────────────────────────────────

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { type: "spring" as const, stiffness: 240, damping: 22 } },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ModuleSelectionScreenProps {
  activeModule:  JourneyModuleWithStatus;
  placeholders:  LockedModulePlaceholder[];
  onSelectModule: (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ModuleSelectionScreen: React.FC<ModuleSelectionScreenProps> = ({
  activeModule,
  placeholders,
  onSelectModule,
}) => {
  const cfg = MODULE_CFG[activeModule.id] ?? MODULE_CFG.fundamentals;

  const pct       = activeModule.totalCount > 0
    ? Math.round((activeModule.completedCount / activeModule.totalCount) * 100)
    : 0;
  const completed = activeModule.completedCount;
  const total     = activeModule.totalCount;

  return (
    <div className="relative min-h-screen w-full overflow-y-auto overflow-x-hidden bg-zinc-950">


      <FloatingParticles />

      {/* Ambient top glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full opacity-15"
        style={{ background: `radial-gradient(ellipse, rgba(${cfg.accentRgb},0.7) 0%, transparent 65%)` }}
      />

      <div className="relative mx-auto max-w-5xl px-4 py-16 md:px-8">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >



          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl">
            Choose Your Module
          </h1>
          <p className="mt-4 text-base text-zinc-500 md:text-lg">
            Each module unlocks when the previous one is mastered.
          </p>
        </motion.div>

        {/* ── Featured (active) module card ─────────────────────────────── */}
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          <motion.div variants={fadeUp}>
            <motion.div
              className="group relative cursor-pointer overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl transition-all"
              onClick={() => onSelectModule(activeModule.id)}
            >


              <div className="flex flex-col md:flex-row">
                {/* ── Image panel ── */}
                <div className="relative h-60 shrink-0 overflow-hidden bg-zinc-800 md:h-auto md:w-80">
                  {/* Tint gradient */}
                  <div
                    className="absolute inset-0 z-10"
                    style={{
                      background: `linear-gradient(135deg, rgba(${cfg.accentRgb},0.25) 0%, transparent 60%)`,
                    }}
                  />
                  {/* Bottom fade for mobile (overlaps text below) */}
                  <div className="absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-zinc-900 to-transparent md:hidden" />
                  {/* Right fade for desktop */}
                  <div className="absolute inset-y-0 right-0 z-10 hidden w-24 bg-gradient-to-l from-zinc-900 to-transparent md:block" />

                  <motion.div
                    className="absolute inset-0"
                    whileHover={{ scale: 1.06 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Image
                      src={cfg.image}
                      alt={activeModule.title}
                      fill
                      className="object-cover object-center"
                      priority
                    />
                  </motion.div>

                  {/* Radial glow behind image */}
                  <div
                    className="pointer-events-none absolute inset-0 z-0"
                    style={{
                      background: `radial-gradient(ellipse at 50% 60%, rgba(${cfg.accentRgb},0.3) 0%, transparent 65%)`,
                    }}
                  />

                  {/* Tag badge */}
                  <div className="absolute left-4 top-4 z-20 flex items-center gap-1.5 rounded-[8px] border bg-black/60 px-3 py-1 text-[10px] font-bold tracking-widest backdrop-blur-sm"
                       style={{ borderColor: `rgba(${cfg.accentRgb},0.35)`, color: `rgb(${cfg.accentRgb})` }}>
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        background: `rgb(${cfg.accentRgb})`,
                        boxShadow: `0 0 6px 2px rgba(${cfg.accentRgb},0.6)`,
                      }}
                    />
                    {cfg.tag}
                  </div>
                </div>

                {/* ── Info panel ── */}
                <div className="flex flex-1 flex-col justify-between p-7">
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-xs font-semibold tracking-widest text-zinc-500">
                        Module 01
                      </span>
                    </div>

                    <h2 className="text-2xl font-black text-white md:text-3xl">
                      {activeModule.title}
                    </h2>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
                      {cfg.tagline}
                    </p>



                  </div>

                  {/* Progress + CTA */}
                  <div className="mt-8 space-y-4">
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-400 font-medium tracking-wide">Progress</span>
                        <span className="text-xs font-bold text-zinc-200">
                          {completed}/{total} steps
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: `rgb(${cfg.accentRgb})` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                        />
                      </div>
                      <p className="text-[11px] font-medium text-zinc-500">
                        {completed === total && total > 0
                          ? "✓ Module complete!"
                          : completed > 0
                          ? `${pct}% done — keep going`
                          : "Ready to start — 0% complete"}
                      </p>
                    </div>

                    {/* CTA button */}
                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm text-zinc-950 transition-all hover:bg-zinc-200"
                    >
                      {completed > 0 ? "Continue Learning" : "Start Module"}
                      <ChevronRight size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* ── Locked modules grid ────────────────────────────────────── */}
          {placeholders.length > 0 && (
            <motion.div variants={fadeUp} className={`grid gap-4 ${placeholders.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
              {placeholders.map((mod, idx) => {
                const lcfg = MODULE_CFG[mod.id] ?? MODULE_CFG.rhythm;
                return (
                  <div
                    key={mod.id}
                    className="group relative overflow-hidden rounded-2xl bg-zinc-900/50 cursor-not-allowed transition-all"
                    title="Coming soon"
                  >
                    {/* Image area */}
                    <div className="relative h-40 overflow-hidden bg-zinc-800/40">
                      {/* Color ghost */}
                      <div
                        className="pointer-events-none absolute inset-0 z-10"
                        style={{
                          background: `radial-gradient(ellipse at 50% 60%, rgba(${lcfg.accentRgb},0.12) 0%, transparent 70%)`,
                        }}
                      />
                      <div className="absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-zinc-900/90 to-transparent" />

                      {/* Generic lock or just nothing visible */}

                      {/* Lock */}
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800/50 bg-zinc-900/80 backdrop-blur-md">
                          <Lock size={16} className="text-zinc-700" />
                        </div>
                        <span className="rounded-full bg-zinc-900/60 px-3 py-0.5 text-[9px] font-bold uppercase tracking-widest text-zinc-700 backdrop-blur-sm ring-1 ring-zinc-800/50">
                          Coming Soon
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 opacity-40 grayscale">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800/50 text-zinc-700">
                          <Lock size={14} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-800">
                          Locked Module
                        </span>
                        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-zinc-800">
                          Module 0{idx + 2}
                        </span>
                      </div>
                      <div className="h-4 w-24 rounded bg-zinc-800/50 mt-1" />
                      <div className="h-3 w-32 rounded bg-zinc-800/30 mt-1.5" />
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}



        </motion.div>
      </div>
    </div>
  );
};
