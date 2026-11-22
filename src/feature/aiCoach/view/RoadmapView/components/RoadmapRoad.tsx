import { cn } from "assets/lib/utils";
import type { RoadPathStop } from "components/RoadPath/RoadPath";
import { RoadPath, roadWaveX } from "components/RoadPath/RoadPath";
import type { RoadTone } from "components/RoadPath/RoadPathNode";
import { useTranslation } from "hooks/useTranslation";
import { Check, ClipboardCheck, Loader2, Lock, Music } from "lucide-react";
import type { ReactNode } from "react";
import React from "react";

import type { RoadmapPhase } from "../../../types/roadmap.types";
import type { PhaseCheckState } from "../../../utils/phaseCheck";
import { getPhaseCheckState } from "../../../utils/phaseCheck";
import type { RoadmapStepRef } from "../../../utils/roadmapSteps";
import { getStepStatus } from "../../../utils/stepStatus";

/** A checkpoint's stop id on the road — a step's is its own id. */
export const checkpointStopId = (phaseId: string) => `check:${phaseId}`;

/** A phase's name across the road, over its first step. */
const PhaseSign = ({
  phaseIdx,
  phase,
}: {
  phaseIdx: number;
  phase: RoadmapPhase;
}) => {
  const { t } = useTranslation("ai_coach");
  const done = phase.steps.filter((s) => getStepStatus(s) === "done").length;
  return (
    <div className='flex justify-center py-3'>
      <div className='flex flex-col items-center rounded-xl bg-zinc-800 px-6 py-2.5 text-center'>
        <span className='text-xs font-medium tabular-nums text-zinc-400'>
          {t("phase_n", { n: phaseIdx + 1 })}
        </span>
        <span className='font-display text-base font-bold leading-tight text-zinc-50 [text-wrap:balance] md:text-lg'>
          {phase.title}
        </span>
        <span className='mt-0.5 text-xs tabular-nums text-zinc-500'>
          {t("steps_of", { done, total: phase.steps.length })}
        </span>
      </div>
    </div>
  );
};

/** The tick on a finished step's corner — the same one Journey wears. */
const DoneBadge = () => (
  <span className='absolute -bottom-2 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-950 p-0.5'>
    <span className='flex h-full w-full items-center justify-center rounded-full bg-emerald-400 text-zinc-950 shadow-[0_2px_0_0_rgb(4,120,87)]'>
      <Check size={12} strokeWidth={3.5} />
    </span>
  </span>
);

const StepLabel = ({ stepRef }: { stepRef: RoadmapStepRef }) => {
  const { t } = useTranslation("ai_coach");
  const status = getStepStatus(stepRef.step);
  return (
    <>
      <span className='text-xs font-bold tabular-nums text-zinc-500'>
        #{stepRef.index + 1}
      </span>
      <p
        className={cn(
          "mt-0.5 line-clamp-3 text-xs font-semibold leading-snug",
          status === "done" ? "text-zinc-400" : "text-zinc-200",
        )}>
        {stepRef.step.title}
      </p>
      {status === "in-progress" && (
        <span className='mt-1 text-[11px] font-semibold text-amber-400'>
          {t("status.in_progress")}
        </span>
      )}
    </>
  );
};

const CHECK_TONE: Record<PhaseCheckState, RoadTone> = {
  locked: "locked",
  ready: "streak",
  passed: "done",
};

const CHECK_LABEL: Record<PhaseCheckState, string> = {
  locked: "checkpoint.locked",
  ready: "checkpoint.ready",
  passed: "checkpoint.passed",
};

interface RoadmapRoadProps {
  phases: RoadmapPhase[];
  steps: RoadmapStepRef[];
  /** The stop whose bubble is open under it. */
  selectedId: string | null;
  /** Where the player goes next — a step id or a checkpoint stop id. */
  upNextId: string | null;
  /** Whether "Continue" or "Start" sits over the next stop. */
  hasStarted: boolean;
  isStepLoading: (stepId: string) => boolean;
  onSelect: (stopId: string) => void;
  renderStepBubble: (ref: RoadmapStepRef, pointerOffset: number) => ReactNode;
  renderCheckpointBubble: (
    phase: RoadmapPhase,
    phaseIdx: number,
    pointerOffset: number,
  ) => ReactNode;
  footer?: ReactNode;
}

/**
 * The roadmap as one winding road, the way Journey draws a module: every
 * step a key on the road, each phase's checkpoint a smaller stop after its
 * steps, and the phase's name across the road over its first step. Tapping a
 * stop opens its bubble right under it.
 */
export const RoadmapRoad: React.FC<RoadmapRoadProps> = ({
  phases,
  steps,
  selectedId,
  upNextId,
  hasStarted,
  isStepLoading,
  onSelect,
  renderStepBubble,
  renderCheckpointBubble,
  footer,
}) => {
  const { t } = useTranslation("ai_coach");
  const stops: RoadPathStop[] = [];

  phases.forEach((phase, phaseIdx) => {
    steps
      .filter((ref) => ref.phaseIdx === phaseIdx)
      .forEach((ref) => {
        const { step } = ref;
        const status = getStepStatus(step);
        const isOpen = selectedId === step.id;
        const isNext = upNextId === step.id;
        const index = stops.length;
        stops.push({
          id: step.id,
          tone: status === "done" ? "done" : isNext ? "current" : "open",
          icon: isStepLoading(step.id) ? (
            <Loader2 size={24} className='animate-spin' />
          ) : step.suggestedSong ? (
            <Music size={26} strokeWidth={2.5} />
          ) : (
            <span className='text-xl font-black tabular-nums'>
              {ref.index + 1}
            </span>
          ),
          title: step.title,
          selected: isOpen,
          startLabel:
            isNext && !isOpen
              ? hasStarted
                ? t("card.continue")
                : t("start_here")
              : undefined,
          badge: status === "done" ? <DoneBadge /> : undefined,
          label: <StepLabel stepRef={ref} />,
          before:
            ref.stepIdx === 0 ? (
              <PhaseSign phaseIdx={phaseIdx} phase={phase} />
            ) : undefined,
          after: isOpen ? renderStepBubble(ref, roadWaveX(index)) : undefined,
          onClick: () => onSelect(step.id),
        });
      });

    const checkState = getPhaseCheckState(phase);
    const id = checkpointStopId(phase.id);
    const isOpen = selectedId === id;
    const index = stops.length;
    const Icon =
      checkState === "locked"
        ? Lock
        : checkState === "passed"
          ? Check
          : ClipboardCheck;
    stops.push({
      id,
      tone: CHECK_TONE[checkState],
      icon: <Icon size={26} strokeWidth={2.5} />,
      title: t("checkpoint.show_what", { phase: phaseIdx + 1 }),
      selected: isOpen,
      startLabel: upNextId === id && !isOpen ? t("card.continue") : undefined,
      label: (
        <p className='text-xs font-semibold leading-snug text-zinc-300'>
          {t(CHECK_LABEL[checkState])}
        </p>
      ),
      // A phase with no steps still gets its sign, on its checkpoint.
      before:
        phase.steps.length === 0 ? (
          <PhaseSign phaseIdx={phaseIdx} phase={phase} />
        ) : undefined,
      after: isOpen
        ? renderCheckpointBubble(phase, phaseIdx, roadWaveX(index))
        : undefined,
      onClick: () => onSelect(id),
    });
  });

  return <RoadPath stops={stops} className='pb-14 pt-4' footer={footer} />;
};
