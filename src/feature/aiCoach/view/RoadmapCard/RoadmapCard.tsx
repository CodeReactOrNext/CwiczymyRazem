import { ArrowRight, CheckCircle2, Circle, Clock, Trash2 } from "lucide-react";
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
  const inProgress = allSteps.filter(
    (s) => s.sessionsCompleted > 0 && s.sessionsCompleted < s.sessionsRequired
  ).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  return { total, done, inProgress, progress };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const LEVEL_COLOR: Record<string, string> = {
  "Absolute Beginner": "text-sky-400 bg-sky-500/10 border-sky-500/20",
  "Beginner": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  "Intermediate": "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "Advanced": "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

const RoadmapCard: React.FC<RoadmapCardProps> = ({ roadmap, onOpen, onDelete }) => {
  const { total, done, inProgress, progress } = getRoadmapStats(roadmap);
  const levelCls = LEVEL_COLOR[roadmap.level] ?? "text-zinc-400 bg-zinc-800 border-zinc-700";

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      className="group relative flex cursor-pointer flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900"
      onClick={onOpen}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h3 className="truncate text-base font-bold text-zinc-100">{roadmap.title}</h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-zinc-500">{roadmap.goal}</p>
        </div>

        <button
          onClick={handleDelete}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-700 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-950/40 hover:text-red-500"
          title="Delete roadmap"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-zinc-400">Progress</span>
          <span
            className={`font-bold tabular-nums ${
              progress === 100
                ? "text-emerald-400"
                : progress > 0
                  ? "text-amber-400"
                  : "text-zinc-600"
            }`}
          >
            {progress}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              progress === 100 ? "bg-emerald-500" : progress > 0 ? "bg-amber-500" : "bg-zinc-700"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          {done}/{total} steps done
        </span>
        {inProgress > 0 && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            {inProgress} in progress
          </span>
        )}
        {done === 0 && inProgress === 0 && (
          <span className="flex items-center gap-1.5">
            <Circle className="h-3.5 w-3.5 text-zinc-700" />
            Not started
          </span>
        )}
        <span className="ml-auto text-zinc-700">{roadmap.phases.length} phases</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-zinc-800/60 pt-3">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${levelCls}`}
          >
            {roadmap.level}
          </span>
          <span className="text-[11px] text-zinc-700">{formatDate(roadmap.createdAt)}</span>
        </div>

        <span className="flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors group-hover:text-emerald-400">
          Open
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  );
};

export default RoadmapCard;
