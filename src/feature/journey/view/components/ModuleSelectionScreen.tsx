import { cn } from "assets/lib/utils";
import { FeedbackModal } from "components/FeedbackBubble/FeedbackBubble";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { motion } from "framer-motion";
import {
  BookOpen,
  Check,
  ChevronRight,
  Compass,
  Drum,
  Grid3x3,
  Guitar,
  Lightbulb,
  type LucideIcon,
  MapPin,
  Mic2,
  Music2,
  Music3,
  Music4,
  Play,
  PlayCircle,
  Radio,
  RotateCcw,
  Sparkles,
  Target,
  Timer,
  Wand2,
  Waves,
  Zap,
} from "lucide-react";
import React, { useState } from "react";

import type { JourneyModuleWithStatus, LockedModulePlaceholder } from "../../types/journey.types";

// ─── Config ───────────────────────────────────────────────────────────────────
// Each module gets its own duotone, plus a small icon set that stands in for
// the login page's guitar/music watermark — same tiled-pattern technique
// (see GuitarPatternBackground), just recolored and re-themed per module.

const MODULE_CFG: Record<string, {
  from:  string;
  to:    string;
  Icon:  LucideIcon;
  icons: LucideIcon[];
}> = {
  fundamentals: {
    from: "#2bb9cc", to: "#0a414c", Icon: Guitar,
    icons: [Guitar, Music2, Sparkles, PlayCircle],
  },
  fretboard: {
    from: "#34c795", to: "#0b4531", Icon: Grid3x3,
    icons: [Grid3x3, Target, Compass, MapPin],
  },
  rhythm: {
    from: "#e8a845", to: "#6e430b", Icon: Drum,
    icons: [Drum, Music4, Waves, Timer],
  },
  scales: {
    from: "#9b72e0", to: "#3a2064", Icon: Music2,
    icons: [Music2, Wand2, BookOpen, Sparkles],
  },
  improvisation: {
    from: "#e8815f", to: "#7a3226", Icon: Mic2,
    icons: [Mic2, Zap, Radio, Music3],
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ModuleSelectionScreenProps {
  modules:       JourneyModuleWithStatus[];
  placeholders:  LockedModulePlaceholder[];
  onSelectModule: (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ModuleSelectionScreen: React.FC<ModuleSelectionScreenProps> = ({
  modules,
  placeholders,
  onSelectModule,
}) => {
  const [suggestOpen, setSuggestOpen] = useState(false);

  // First module that isn't fully finished yet — gets the "pick up here" treatment.
  const activeIdx = modules.findIndex((m) => m.totalCount === 0 || m.completedCount < m.totalCount);

  return (
    <div className="relative min-h-screen w-full overflow-y-auto overflow-x-hidden bg-zinc-950">
      {/* Ambient depth — keeps the page from reading as flat black */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{ background: "radial-gradient(60% 100% at 50% 0%, rgba(6,182,212,0.08) 0%, transparent 70%)" }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl px-4 py-8 md:px-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {modules.map((module, idx) => {
              const cfg = MODULE_CFG[module.id] ?? MODULE_CFG.fundamentals;
              const Icon = cfg.Icon;
              const pct = module.totalCount > 0
                ? Math.round((module.completedCount / module.totalCount) * 100)
                : 0;
              const completed = module.completedCount;
              const total = module.totalCount;
              const isComplete = total > 0 && completed === total;
              const isCurrent = idx === activeIdx;
              const CtaIcon = isComplete ? RotateCcw : completed > 0 ? ChevronRight : Play;

              return (
                <motion.button
                  key={module.id}
                  type="button"
                  onClick={() => onSelectModule(module.id)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.08, ease: "easeOut" }}
                  aria-label={module.title}
                  className={cn(
                    "group relative flex aspect-square flex-col justify-between overflow-hidden rounded-lg bg-zinc-800/50 p-4 text-left transition-background hover:bg-zinc-800/70 active:click-behavior focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                    isCurrent && "bg-zinc-800/70 ring-1 ring-white/15"
                  )}
                >
                  {/* Same tiled-icon watermark used on /login and the dashboard support banner
                      (GuitarPatternBackground / HeroPattern) — re-themed per module, kept as a
                      quiet texture rather than a colored background. */}
                  <GuitarPatternBackground opacity={0.07} scale={0.65} icons={cfg.icons} />

                  {/* Module color as a confident wash from the corner — strong enough that
                      cards read as distinct from each other at a glance, not just a hint. */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ background: `linear-gradient(160deg, ${cfg.from}59 0%, ${cfg.to}40 55%, transparent 100%)` }}
                    aria-hidden
                  />

                  <div className="relative flex items-start justify-between">
                    <Icon size={18} strokeWidth={2} style={{ color: cfg.from }} />
                    {isComplete && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-950 p-1">
                        <span className="flex h-full w-full items-center justify-center rounded-full bg-emerald-400 text-zinc-950">
                          <Check size={11} strokeWidth={3.5} />
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Title + completion — the only two facts the card needs */}
                  <div className="relative mt-auto">
                    <h2 className="text-balance font-display text-lg font-black leading-tight text-white">
                      {module.title}
                    </h2>

                    <div className="mt-2.5 flex items-end justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-900/60">
                          <div
                            className="h-full rounded-full transition-[width] duration-500 ease-out"
                            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${cfg.from}b3, ${cfg.from})` }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] font-medium tabular-nums text-zinc-400">
                          {completed}/{total}
                        </p>
                      </div>

                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 transition-background group-hover:bg-white">
                        <CtaIcon size={12} strokeWidth={2.5} />
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* ─── Suggest a path ─── */}
          <button
            onClick={() => setSuggestOpen(true)}
            className="flex w-full items-center gap-4 rounded-lg bg-zinc-900/40 px-5 py-4 text-left transition-background hover:bg-zinc-900/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:click-behavior"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
              <Lightbulb className="h-4 w-4 text-zinc-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-300">Suggest a learning path</p>
              <p className="text-xs text-zinc-500">
                {placeholders.length > 0
                  ? `Missing a topic? ${placeholders.map((p) => p.title).join(", ")} are coming next — let us know what else you'd like to see.`
                  : "Missing a topic? Let us know what you'd like to see next."}
              </p>
            </div>
          </button>

          <FeedbackModal isOpen={suggestOpen} onClose={() => setSuggestOpen(false)} />

        </div>
      </div>
    </div>
  );
};
