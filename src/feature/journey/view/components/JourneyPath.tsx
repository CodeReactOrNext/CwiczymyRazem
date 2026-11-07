import { buttonVariants } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import type { RoadPathStop } from "components/RoadPath/RoadPath";
import { RoadPath } from "components/RoadPath/RoadPath";
import { useTranslation } from "hooks/useTranslation";
import { Check, ChevronLeft, Star } from "lucide-react";
import React from "react";

import type {
  JourneyModuleWithStatus,
  JourneyStepWithStatus,
} from "../../types/journey.types";
import { getStepIcon } from "../../utils/stepIcons";
import { JourneyFinishCard } from "./JourneyFinishCard";

// ─── Step label ───────────────────────────────────────────────────────────────

/** Beside each step on the road: its number, its name, and how it went. */
function StepLabel({ step }: { step: JourneyStepWithStatus }) {
  const { t } = useTranslation("journey");
  const isLocked = step.status === "locked";
  const isCompleted = step.status === "completed";

  return (
    <>
      <span
        className={cn(
          "text-[10px] font-bold tabular-nums",
          isLocked ? "text-zinc-700" : "text-zinc-500",
        )}>
        #{step.order}
      </span>
      <p
        className={cn(
          "mt-0.5 line-clamp-3 text-xs font-semibold leading-snug",
          isLocked
            ? "text-zinc-600"
            : isCompleted
              ? "text-zinc-400"
              : "text-zinc-200",
        )}>
        {step.title}
      </p>
      {step.status === "in-progress" && (
        <span className='mt-1 rounded bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-cyan-400'>
          {t("sidebar.status.in-progress")}
        </span>
      )}
      {isCompleted && step.stars && (
        <div className='mt-1 flex items-center gap-0.5'>
          {[1, 2, 3].map((i) => (
            <Star
              key={i}
              size={9}
              className={i <= step.stars! ? "text-amber-400" : "text-zinc-700"}
            />
          ))}
        </div>
      )}
    </>
  );
}

/** The tick on a finished step's corner. */
const DoneBadge = () => (
  <span className='absolute -bottom-2 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-950 p-0.5'>
    <span className='flex h-full w-full items-center justify-center rounded-full bg-emerald-400 text-zinc-950 shadow-[0_2px_0_0_rgb(4,120,87)]'>
      <Check size={12} strokeWidth={3.5} />
    </span>
  </span>
);

// ─── StageDivider ─────────────────────────────────────────────────────────────

function StageDivider({ label }: { label: string }) {
  return (
    <div className='relative z-10 flex items-center gap-3 text-zinc-600'>
      <span className='rounded bg-zinc-900/60 px-3 py-1 text-[11px] font-bold tracking-widest text-zinc-500'>
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
    if (stage.label)
      entries.push({
        kind: "divider",
        id: `divider_${stage.id}`,
        label: stage.label,
      });
    stage.steps.forEach((step) =>
      entries.push({ kind: "step", id: step.id, step }),
    );
  });
  return entries;
}

// ─── JourneyPath ──────────────────────────────────────────────────────────────

interface JourneyPathProps {
  module: JourneyModuleWithStatus;
  onStepClick: (step: JourneyStepWithStatus) => void;
  onBack: () => void;
}

export const JourneyPath: React.FC<JourneyPathProps> = ({
  module,
  onStepClick,
  onBack,
}) => {
  const { t } = useTranslation("journey");
  // A stage's title rides on its first step, so the road runs through it.
  let pendingDivider: string | null = null;
  let startPlaced = false;
  const stops: RoadPathStop[] = [];
  buildEntries(module).forEach((entry) => {
    if (entry.kind === "divider") {
      pendingDivider = entry.label;
      return;
    }
    const { step } = entry;
    const isCurrent =
      step.status === "available" || step.status === "in-progress";
    const isStart = isCurrent && !startPlaced;
    if (isStart) startPlaced = true;
    stops.push({
      id: step.id,
      tone:
        step.status === "completed" ? "done" : isCurrent ? "current" : "locked",
      icon: getStepIcon(step.stepIcon, 26),
      title: step.title,
      disabled: step.status === "locked",
      startLabel: isStart ? t("path.start") : undefined,
      badge: step.status === "completed" ? <DoneBadge /> : undefined,
      label: <StepLabel step={step} />,
      before: pendingDivider ? (
        <StageDivider label={pendingDivider} />
      ) : undefined,
      onClick: () => onStepClick(step),
    });
    pendingDivider = null;
  });

  return (
    <div className='relative flex-1 overflow-y-auto bg-zinc-950'>
      {/* ── Hero banner ── */}
      <div className='relative overflow-hidden px-6 py-10 md:px-10'>
        <GuitarPatternBackground className='pointer-events-none absolute inset-0 h-full w-full' />
        <div
          className='pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-30'
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(6,182,212,0.25) 0%, transparent 70%)",
          }}
        />

        <div className='relative'>
          <button
            type='button'
            onClick={onBack}
            className={cn(
              buttonVariants({ variant: "subtle", size: "sm" }),
              "group mb-6 gap-1.5 text-zinc-400",
            )}>
            <ChevronLeft
              size={12}
              strokeWidth={3}
              className='transition-transform group-hover:-translate-x-0.5'
            />
            {t("path.modules")}
          </button>

          <div>
            <h1 className='font-display text-3xl font-black tracking-tight text-zinc-100 md:text-4xl'>
              {module.title}
            </h1>
            <p className='mt-1 max-w-xs text-sm text-zinc-400'>
              {module.subtitle}
            </p>
          </div>

          <div className='mt-6 flex items-center gap-3'>
            <div className='h-1.5 w-40 overflow-hidden rounded-full bg-zinc-800'>
              <div
                className='h-full rounded-full bg-cyan-500'
                style={{
                  width:
                    module.totalCount > 0
                      ? `${(module.completedCount / module.totalCount) * 100}%`
                      : 0,
                }}
              />
            </div>
            <span className='text-xs text-zinc-500'>
              {t("finish.steps", {
                done: module.completedCount,
                total: module.totalCount,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Path ── */}
      <div className='relative px-3 py-4 md:px-10'>
        {/* Ambient texture — same tiled watermark used on /login, not a graphic */}
        <GuitarPatternBackground className='pointer-events-none absolute inset-0 h-full w-full' />

        {/* The finish line, on the road whether or not it has been reached:
            the guitar waiting at the end is the reason to keep walking it. */}
        <RoadPath
          stops={stops}
          className='pb-14 pt-10'
          footer={
            <JourneyFinishCard
              moduleId={module.id}
              done={module.completedCount}
              total={module.totalCount}
            />
          }
        />
      </div>
    </div>
  );
};
