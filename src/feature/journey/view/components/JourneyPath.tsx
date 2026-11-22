import { Chip } from "assets/components/ui/chip";
import { cn } from "assets/lib/utils";
import { BackLink } from "components/BackLink/BackLink";
import { PageTitle } from "components/PageTitle/PageTitle";
import type { RoadPathStop } from "components/RoadPath/RoadPath";
import { RoadPath, roadWaveX } from "components/RoadPath/RoadPath";
import { useTranslation } from "hooks/useTranslation";
import { Check, Star } from "lucide-react";
import type { ReactNode } from "react";
import React from "react";

import type {
  JourneyModuleWithStatus,
  JourneyStepWithStatus,
} from "../../types/journey.types";
import { getStepIcon } from "../../utils/stepIcons";
import { JourneyFinishCard } from "./JourneyFinishCard";
import { JourneyLandmark } from "./JourneyLandmark";

// ─── Step label ───────────────────────────────────────────────────────────────

/** Beside each step on the road: its number and its name. */
function StepLabel({ step }: { step: JourneyStepWithStatus }) {
  const { t } = useTranslation("journey");
  const isLocked = step.status === "locked";
  const isCompleted = step.status === "completed";

  return (
    <>
      <span
        className={cn(
          "text-xs font-bold tabular-nums",
          isLocked ? "text-zinc-600" : "text-zinc-500",
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
        <Chip color='cyan' size='sm' className='mt-1'>
          {t("sidebar.status.in-progress")}
        </Chip>
      )}
    </>
  );
}

/**
 * How a finished step went, on a dark pill just under its key: filled stars
 * with a lip like the keys, empty ones solid zinc. The pill gives them their
 * own ground, so they read on the road and on any backdrop.
 */
const StarPill = ({ stars }: { stars: 1 | 2 | 3 }) => (
  <span className='flex items-center gap-[3px] rounded-full bg-zinc-950 px-2 pb-[5px] pt-1'>
    {[1, 2, 3].map((i) => (
      <Star
        key={i}
        size={16}
        strokeWidth={0}
        className={
          i <= stars
            ? "fill-amber-400 drop-shadow-[0_1.5px_0_rgb(180,83,9)]"
            : "fill-zinc-700"
        }
      />
    ))}
    <span className='sr-only'>{stars}/3</span>
  </span>
);

/** The tick on a finished step's corner. */
const DoneBadge = () => (
  <span className='absolute -bottom-2 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-950 p-0.5'>
    <span className='flex h-full w-full items-center justify-center rounded-full bg-emerald-400 text-zinc-950 shadow-[0_2px_0_0_rgb(4,120,87)]'>
      <Check size={12} strokeWidth={3.5} />
    </span>
  </span>
);

// ─── StageDivider ─────────────────────────────────────────────────────────────

/**
 * A sign on the road where a section starts. Solid, so the road passes behind
 * it, and big enough to find a section while scrolling past it. Beside it, on
 * alternating sides, the section's landmark.
 */
function StageDivider({
  order,
  label,
  moduleId,
  stageId,
}: StageSign & { moduleId: string }) {
  const { t } = useTranslation("journey");
  return (
    <div className='relative flex w-full justify-center py-3'>
      <JourneyLandmark
        moduleId={moduleId}
        stageId={stageId}
        side={order % 2 === 1 ? "left" : "right"}
      />
      <div className='flex flex-col items-center rounded-xl bg-zinc-800 px-6 py-2.5 text-center'>
        <span className='text-xs font-medium tabular-nums text-zinc-400'>
          {t("path.stage", { n: order })}
        </span>
        <span className='font-display text-base font-bold leading-tight text-zinc-50 md:text-lg'>
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── Path entries ─────────────────────────────────────────────────────────────

type StageSign = { order: number; label: string; stageId: string };

type PathEntry =
  | { kind: "divider"; id: string; sign: StageSign }
  | { kind: "step"; id: string; step: JourneyStepWithStatus };

function buildEntries(module: JourneyModuleWithStatus): PathEntry[] {
  const entries: PathEntry[] = [];
  module.stages.forEach((stage, index) => {
    if (stage.label)
      entries.push({
        kind: "divider",
        id: `divider_${stage.id}`,
        sign: { order: index + 1, label: stage.label, stageId: stage.id },
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
  /** The step whose bubble is open under it on the road. */
  openStepId?: string | null;
  onStepClick: (step: JourneyStepWithStatus) => void;
  /** What opens under the tapped step; `pointerOffset` puts the bubble's pointer under it. */
  renderBubble?: (
    step: JourneyStepWithStatus,
    pointerOffset: number,
  ) => ReactNode;
  onBack: () => void;
}

export const JourneyPath: React.FC<JourneyPathProps> = ({
  module,
  openStepId,
  onStepClick,
  renderBubble,
  onBack,
}) => {
  const { t } = useTranslation("journey");
  // A stage's title rides on its first step, so the road runs through it.
  let pendingDivider: StageSign | null = null;
  let startPlaced = false;
  const stops: RoadPathStop[] = [];
  buildEntries(module).forEach((entry) => {
    if (entry.kind === "divider") {
      pendingDivider = entry.sign;
      return;
    }
    const { step } = entry;
    const isCurrent =
      step.status === "available" || step.status === "in-progress";
    const isStart = isCurrent && !startPlaced;
    if (isStart) startPlaced = true;
    const isOpen = step.id === openStepId;
    const index = stops.length;
    stops.push({
      id: step.id,
      tone:
        step.status === "completed" ? "done" : isCurrent ? "current" : "locked",
      icon: getStepIcon(step.stepIcon, 26),
      title: step.title,
      disabled: step.status === "locked",
      selected: isOpen,
      // The bubble says it now, so the tag over the start would only repeat it.
      startLabel: isStart && !isOpen ? t("path.start") : undefined,
      badge: step.status === "completed" ? <DoneBadge /> : undefined,
      below:
        step.status === "completed" && step.stars ? (
          <StarPill stars={step.stars} />
        ) : undefined,
      label: <StepLabel step={step} />,
      before: pendingDivider ? (
        <StageDivider {...pendingDivider} moduleId={module.id} />
      ) : undefined,
      after:
        isOpen && renderBubble
          ? renderBubble(step, roadWaveX(index))
          : undefined,
      onClick: () => onStepClick(step),
    });
    pendingDivider = null;
  });

  return (
    <div className='relative flex-1 overflow-y-auto'>
      {/* ── Hero banner ── */}
      <div className='relative overflow-hidden px-4 pb-2 pt-5 md:px-10 md:py-10'>
        <div className='relative'>
          <BackLink
            label={t("path.modules")}
            onClick={onBack}
            className='mb-3 md:mb-6'
          />

          <PageTitle title={module.title} subtitle={module.subtitle} />

          <div className='mt-3 flex items-center gap-3 md:mt-6'>
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
      {/* Clips sideways: the landmarks peek in from past the screen edge. */}
      <div className='relative overflow-x-clip px-3 py-0 md:px-10 md:py-4'>
        {/* The finish line, on the road whether or not it has been reached:
            the guitar waiting at the end is the reason to keep walking it. */}
        <RoadPath
          stops={stops}
          trail='band'
          className='gap-[72px] pb-14 pt-4 md:pt-10'
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
