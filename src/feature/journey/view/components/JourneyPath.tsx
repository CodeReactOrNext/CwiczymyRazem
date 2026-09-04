import { cn } from "assets/lib/utils";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { Check, ChevronLeft, Guitar } from "lucide-react";
import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { FaStar } from "react-icons/fa";

import type { JourneyModuleWithStatus, JourneyStepWithStatus } from "../../types/journey.types";
import { getStepIcon } from "../../utils/stepIcons";
import { JourneyFinishCard } from "./JourneyFinishCard";

const WAVE_AMPLITUDE = 56;

// ─── PathNode ─────────────────────────────────────────────────────────────────

function PathNode({
  step,
  x,
  side,
  onClick,
  registerRef,
}: {
  step: JourneyStepWithStatus;
  x: number;
  side: "left" | "right";
  onClick: () => void;
  registerRef: (el: HTMLButtonElement | null) => void;
}) {
  const isLocked = step.status === "locked";
  const isCompleted = step.status === "completed";
  const isCurrent = step.status === "available" || step.status === "in-progress";

  return (
    <div
      className="relative z-10 flex justify-center"
      style={{ transform: `translateX(${x}px)` }}
    >
      {/* Halo — cuts a clean gap between the node and the connector line behind it */}
      <div className="rounded-full bg-zinc-950 p-2 pb-3">
        <button
          ref={registerRef}
          onClick={onClick}
          disabled={isLocked}
          aria-label={step.title}
          className={cn(
            "relative flex h-20 w-20 items-center justify-center rounded-full transition-[transform,box-shadow,background-color] duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed",
            isLocked &&
              "bg-zinc-700 text-zinc-500 shadow-[0_4px_0_0_rgb(24,24,27)]",
            isCompleted &&
              "bg-emerald-500 text-zinc-950 shadow-[0_5px_0_0_rgb(4,120,87)] hover:bg-emerald-400 active:translate-y-[5px] active:shadow-none",
            isCurrent &&
              "bg-cyan-500 text-zinc-950 shadow-[0_5px_0_0_rgb(14,116,144)] hover:bg-cyan-400 active:translate-y-[5px] active:shadow-none"
          )}
        >
          {/* Glossy top-light — sells the extruded/3D read */}
          <span
            className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-white/0 to-black/10"
            aria-hidden
          />

          {isCurrent && (
            <span
              className="absolute inset-0 rounded-full bg-cyan-200/30 animate-[ping-slow_1.8s_ease-out_infinite]"
              aria-hidden
            />
          )}
          <span className="relative">{getStepIcon(step.stepIcon, 26)}</span>

          {isCompleted && (
            <span className="absolute -bottom-2 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-950 p-0.5">
              <span className="flex h-full w-full items-center justify-center rounded-full bg-emerald-400 text-zinc-950 shadow-[0_2px_0_0_rgb(4,120,87)]">
                <Check size={12} strokeWidth={3.5} />
              </span>
            </span>
          )}
        </button>
      </div>

      {/* Label — sits beside the node instead of stacking below it */}
      <div
        className={cn(
          "absolute top-1/2 flex w-28 -translate-y-1/2 flex-col",
          side === "left" ? "right-full mr-3 items-end text-right" : "left-full ml-3 items-start text-left"
        )}
      >
        <span className={cn("text-[10px] font-bold tabular-nums", isLocked ? "text-zinc-700" : "text-zinc-500")}>
          #{step.order}
        </span>
        <p className={cn(
          "mt-0.5 line-clamp-3 text-xs font-semibold leading-snug",
          isLocked ? "text-zinc-600" : isCompleted ? "text-zinc-400" : "text-zinc-200"
        )}>
          {step.title}
        </p>
        {step.status === "in-progress" && (
          <span className="mt-1 rounded bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-cyan-400">
            In progress
          </span>
        )}
        {isCompleted && step.stars && (
          <div className="mt-1 flex items-center gap-0.5">
            {[1, 2, 3].map((i) => (
              <FaStar key={i} size={9} className={i <= step.stars! ? "text-amber-400" : "text-zinc-700"} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── StageDivider ─────────────────────────────────────────────────────────────

function StageDivider({ label }: { label: string }) {
  return (
    <div className="relative z-10 flex items-center gap-3 text-zinc-600">
      <span className="rounded bg-zinc-900/60 px-3 py-1 text-[11px] font-bold tracking-widest text-zinc-500">
        {label}
      </span>
    </div>
  );
}

// ─── Path entries ─────────────────────────────────────────────────────────────

type PathEntry =
  | { kind: "divider"; id: string; label: string }
  | { kind: "step"; id: string; step: JourneyStepWithStatus };

function buildEntries(module: JourneyModuleWithStatus): PathEntry[] {
  const entries: PathEntry[] = [];
  module.stages.forEach((stage) => {
    if (stage.label) entries.push({ kind: "divider", id: `divider_${stage.id}`, label: stage.label });
    stage.steps.forEach((step) => entries.push({ kind: "step", id: step.id, step }));
  });
  return entries;
}

// ─── JourneyPath ──────────────────────────────────────────────────────────────

interface JourneyPathProps {
  module: JourneyModuleWithStatus;
  onStepClick: (step: JourneyStepWithStatus) => void;
  onBack: () => void;
}

export const JourneyPath: React.FC<JourneyPathProps> = ({ module, onStepClick, onBack }) => {
  const entries = buildEntries(module);
  const stepEntries = entries.filter((e): e is Extract<PathEntry, { kind: "step" }> => e.kind === "step");

  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [points, setPoints] = useState<Record<string, { x: number; y: number }>>({});
  const [canvas, setCanvas] = useState({ width: 0, height: 0 });

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const next: Record<string, { x: number; y: number }> = {};
    nodeRefs.current.forEach((el, id) => {
      const r = el.getBoundingClientRect();
      next[id] = {
        x: r.left + r.width / 2 - containerRect.left,
        y: r.top + r.height / 2 - containerRect.top,
      };
    });
    setPoints(next);
    setCanvas({ width: container.offsetWidth, height: container.offsetHeight });
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, module.completedCount, module.totalCount]);

  const segments: { d: string; stroke: string; dashed: boolean }[] = [];
  for (let i = 1; i < stepEntries.length; i++) {
    const p0 = points[stepEntries[i - 1].id];
    const p1 = points[stepEntries[i].id];
    if (!p0 || !p1) continue;
    const dy = (p1.y - p0.y) / 2;
    const d = `M ${p0.x} ${p0.y} C ${p0.x} ${p0.y + dy}, ${p1.x} ${p1.y - dy}, ${p1.x} ${p1.y}`;
    const destStatus = stepEntries[i].step.status;
    const stroke =
      destStatus === "completed" ? "rgb(16,185,129)" : destStatus === "locked" ? "rgb(63,63,70)" : "rgb(6,182,212)";
    segments.push({ d, stroke, dashed: destStatus === "locked" });
  }

  const waveX = new Map(
    stepEntries.map((entry, i) => [entry.id, WAVE_AMPLITUDE * Math.sin((i * Math.PI) / 2)] as const)
  );
  const labelSide = new Map<string, "left" | "right">(
    stepEntries.map((entry, i) => {
      const x = waveX.get(entry.id) ?? 0;
      const side = x > 0 ? "left" : x < 0 ? "right" : i % 4 === 0 ? "right" : "left";
      return [entry.id, side] as const;
    })
  );

  return (
    <div className="relative flex-1 overflow-y-auto bg-zinc-950">
      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden px-6 py-10 md:px-10">
        <GuitarPatternBackground className="pointer-events-none absolute inset-0 h-full w-full" />
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-30"
          style={{ background: "radial-gradient(ellipse at center, rgba(6,182,212,0.25) 0%, transparent 70%)" }}
        />

        <div className="relative">
          <div className="mb-6 flex w-fit items-center gap-2 rounded-lg bg-zinc-900/50 p-1 px-1.5 backdrop-blur-md">
            <button
              onClick={onBack}
              className="group flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-semibold text-zinc-400 transition-background hover:bg-white/5 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <ChevronLeft size={12} strokeWidth={3} className="transition-transform group-hover:-translate-x-0.5" />
              Modules
            </button>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/30">
              <Guitar size={30} className="text-cyan-400" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-black tracking-tight text-zinc-100 md:text-4xl">
                {module.title}
              </h1>
              <p className="mt-1 max-w-xs text-sm text-zinc-400">{module.subtitle}</p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-cyan-500"
                style={{
                  width: module.totalCount > 0 ? `${(module.completedCount / module.totalCount) * 100}%` : 0,
                }}
              />
            </div>
            <span className="text-xs text-zinc-500">{module.completedCount}/{module.totalCount} steps</span>
          </div>
        </div>
      </div>

      {/* ── Path ── */}
      <div className="relative px-3 py-4 md:px-10">
        {/* Ambient texture — same tiled watermark used on /login, not a graphic */}
        <GuitarPatternBackground className="pointer-events-none absolute inset-0 h-full w-full" />

        <div
          ref={containerRef}
          className="relative mx-auto flex w-full max-w-[480px] flex-col items-center gap-14 pb-14 pt-2"
        >
          <svg className="pointer-events-none absolute left-0 top-0 z-0" width={canvas.width} height={canvas.height} aria-hidden>
            {segments.map((seg, i) => (
              <path
                key={i}
                d={seg.d}
                fill="none"
                stroke={seg.stroke}
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray={seg.dashed ? "2 10" : undefined}
              />
            ))}
          </svg>

          {entries.map((entry) => {
            if (entry.kind === "divider") {
              return <StageDivider key={entry.id} label={entry.label} />;
            }
            const x = waveX.get(entry.id) ?? 0;
            const side = labelSide.get(entry.id) ?? "right";
            return (
              <PathNode
                key={entry.id}
                step={entry.step}
                x={x}
                side={side}
                onClick={() => onStepClick(entry.step)}
                registerRef={(el) => {
                  if (el) nodeRefs.current.set(entry.id, el);
                  else nodeRefs.current.delete(entry.id);
                }}
              />
            );
          })}

          {/* The finish line, on the path whether or not it has been reached:
              the guitar waiting at the end is the reason to keep walking it. */}
          <JourneyFinishCard
            moduleId={module.id}
            done={module.completedCount}
            total={module.totalCount}
          />
        </div>
      </div>
    </div>
  );
};
