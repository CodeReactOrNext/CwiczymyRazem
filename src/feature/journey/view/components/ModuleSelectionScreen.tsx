import { cn } from "assets/lib/utils";
import { FeedbackModal } from "components/FeedbackBubble/FeedbackBubble";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  Compass,
  Grid3x3,
  Guitar,
  Lightbulb,
  type LucideIcon,
  MapPin,
  Music2,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import React, { useState } from "react";

import type { JourneyModuleWithStatus, LockedModulePlaceholder } from "../../types/journey.types";

// ─── Config ───────────────────────────────────────────────────────────────────
// One accent per module, drawn from the app's semantic palette (cyan/emerald/...)
// rather than an arbitrary hue — each module gets its own icon, watermark set
// and color so the sections read as distinct at a glance.

const MODULE_CFG: Record<string, {
  Icon:    LucideIcon;
  icons:   LucideIcon[];
  hex:     string;
  tileBg:  string;
  tileFg:  string;
  wash:    string;
  bar:     string;
  label:   string;
}> = {
  fundamentals: {
    Icon: Guitar,
    icons: [Guitar, Music2, Sparkles, PlayCircle],
    hex: "#22d3ee",
    tileBg: "bg-cyan-500/10",
    tileFg: "text-cyan-400",
    wash: "bg-cyan-500/[0.06] hover:bg-cyan-500/10",
    bar: "bg-cyan-500",
    label: "text-cyan-400",
  },
  fretboard: {
    Icon: Grid3x3,
    icons: [Grid3x3, Target, Compass, MapPin],
    hex: "#a78bfa",
    tileBg: "bg-purple-500/10",
    tileFg: "text-purple-400",
    wash: "bg-purple-500/[0.06] hover:bg-purple-500/10",
    bar: "bg-purple-500",
    label: "text-purple-400",
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

  // First module that isn't fully finished yet — gets the "continue" treatment.
  const activeIdx = modules.findIndex((m) => m.totalCount === 0 || m.completedCount < m.totalCount);

  return (
    <div className="relative min-h-screen w-full overflow-y-auto overflow-x-hidden bg-zinc-950">
      {/* Ambient depth — keeps the page from reading as flat black */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{ background: "radial-gradient(60% 100% at 50% 0%, rgba(6,182,212,0.08) 0%, transparent 70%)" }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-3xl px-4 py-10 md:px-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-white">Learning path</h1>
          <p className="mt-1 text-sm text-zinc-400">Pick up where you left off, or jump into any module.</p>
        </div>

        <div className="space-y-3">
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
            const CtaIcon = isComplete ? RotateCcw : ChevronRight;

            return (
              <motion.button
                key={module.id}
                type="button"
                onClick={() => onSelectModule(module.id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05, ease: "easeOut" }}
                aria-label={module.title}
                className={cn(
                  "group relative flex w-full items-center gap-4 overflow-hidden rounded-lg p-4 text-left transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:click-behavior",
                  cfg.wash
                )}
              >
                {/* Each module gets its own watermark — a different icon set and
                    tint per section instead of one shared texture. */}
                <GuitarPatternBackground opacity={0.09} scale={0.85} color={cfg.hex} icons={cfg.icons} />

                <div className={cn("relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", isComplete ? "bg-emerald-500/10" : cfg.tileBg)}>
                  {isComplete ? (
                    <Check className="h-5 w-5 text-emerald-400" strokeWidth={2.5} />
                  ) : (
                    <Icon className={cn("h-5 w-5", cfg.tileFg)} strokeWidth={2} />
                  )}
                </div>

                <div className="relative min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="truncate font-display text-base font-bold text-white">{module.title}</h2>
                    {isCurrent && !isComplete && (
                      <span className={cn("shrink-0 text-xs font-semibold", cfg.label)}>
                        {completed > 0 ? "Continue" : "Start"}
                      </span>
                    )}
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-800/80">
                      <div
                        className={cn("h-full rounded-full transition-[width] duration-500 ease-out", isComplete ? "bg-emerald-500" : cfg.bar)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-xs font-medium tabular-nums text-zinc-500">
                      {completed}/{total}
                    </span>
                  </div>
                </div>

                <CtaIcon
                  className="relative h-4 w-4 shrink-0 text-zinc-500 transition-colors group-hover:text-zinc-200"
                  strokeWidth={2.5}
                />
              </motion.button>
            );
          })}

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
        </div>
      </div>

      <FeedbackModal isOpen={suggestOpen} onClose={() => setSuggestOpen(false)} />
    </div>
  );
};
