import { ChevronRight } from "lucide-react";
import React from "react";

import type { Roadmap } from "../../types/roadmap.types";

interface RoadmapCardProps {
  roadmap: Roadmap;
  onOpen: () => void;
  onDelete: () => void;
}

function getRoadmapStats(roadmap: Roadmap) {
  const allSteps = roadmap.phases.flatMap((p) => p.steps);
  const total = allSteps.length;
  const done = allSteps.filter((s) => s.sessionsCompleted >= s.sessionsRequired).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  return { total, done, progress };
}

const LEVEL_THEME: Record<string, { accentRgb: string }> = {
  "Absolute Beginner": { accentRgb: "6,182,212"  },
  "Beginner":          { accentRgb: "16,185,129" },
  "Intermediate":      { accentRgb: "245,158,11" },
  "Advanced":          { accentRgb: "139,92,246" },
};

const DEFAULT_THEME = LEVEL_THEME["Intermediate"];

const RoadmapCard: React.FC<RoadmapCardProps> = ({ roadmap, onOpen }) => {
  const { total, done, progress } = getRoadmapStats(roadmap);
  const theme = LEVEL_THEME[roadmap.level] ?? DEFAULT_THEME;
  const { accentRgb } = theme;

  const tag = roadmap.level;
  const ctaLabel = done > 0 ? "Continue Learning" : "Start Learning";
  const progressLabel =
    done === total && total > 0
      ? "✓ Roadmap complete!"
      : done > 0
      ? `${progress}% done — keep going`
      : "Ready to start — 0% complete";

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-lg bg-zinc-900/60 transition-background hover:bg-zinc-900/80"
      onClick={onOpen}
    >
      <div className="flex flex-col md:flex-row">
        {/* ── Image panel ── */}
        <div className="relative h-60 shrink-0 overflow-hidden bg-zinc-800 md:h-auto md:w-80">
          {/* Mobile bottom fade */}
          <div className="absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-zinc-900 to-transparent md:hidden" />
          {/* Desktop right fade */}
          <div className="absolute inset-y-0 right-0 z-10 hidden w-16 bg-gradient-to-l from-zinc-900 to-transparent md:block" />

          {roadmap.image ? (
            <>
              <img
                src={roadmap.image}
                alt={roadmap.title}
                className="absolute inset-0 h-full w-full object-cover"
                style={{ filter: "grayscale(55%) saturate(0.7)" }}
              />
              {/* subtle accent tint over grayscale */}
              <div
                className="absolute inset-0 z-[1]"
                style={{ background: `linear-gradient(160deg, rgba(${accentRgb},0.12) 0%, transparent 55%)` }}
              />
            </>
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: `radial-gradient(ellipse at 50% 60%, rgba(${accentRgb},0.12) 0%, transparent 70%)` }}
            />
          )}

          {/* Tag badge */}
          <div
            className="absolute left-4 top-4 z-20 flex items-center gap-1.5 rounded bg-black/60 px-3 py-1 text-[10px] font-bold tracking-widest backdrop-blur-sm"
            style={{ color: `rgb(${accentRgb})` }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: `rgb(${accentRgb})` }}
            />
            {tag}
          </div>
        </div>

        {/* ── Info panel ── */}
        <div className="flex flex-1 flex-col justify-between p-7">
          <div>
            <div className="mb-3">
              <span className="text-xs font-semibold tracking-widest text-zinc-500">
                {roadmap.phases.length} phases
              </span>
            </div>
            <h2 className="font-display text-2xl font-black text-zinc-100 md:text-3xl">{roadmap.title}</h2>
            {roadmap.goal && roadmap.goal !== roadmap.title && (
              <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">{roadmap.goal}</p>
            )}
          </div>

          {/* Progress + CTA */}
          <div className="mt-8 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium tracking-wide text-zinc-400">Progress</span>
                <span className="text-xs font-bold text-zinc-200">{done}/{total} steps</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ background: `rgb(${accentRgb})`, width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] font-medium text-zinc-500">{progressLabel}</p>
            </div>

            <button
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-800/60 px-6 py-3.5 text-sm font-semibold text-zinc-200 transition-background hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {ctaLabel}
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapCard;
