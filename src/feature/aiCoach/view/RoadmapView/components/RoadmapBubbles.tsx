import { Button } from "assets/components/ui/button";
import { BubbleFrame } from "feature/whatNext/components/StepBubble";
import { useTranslation } from "hooks/useTranslation";
import {
  BookOpen,
  ClipboardCheck,
  ListChecks,
  Music,
  Play,
} from "lucide-react";
import type { ReactNode } from "react";
import React, { useEffect, useRef } from "react";

import type { RoadmapPhase } from "../../../types/roadmap.types";
import type { YouTubeLessonResult } from "../../../types/youtubeLesson.types";
import { parseDescriptionSections } from "../../../utils/parseDescriptionSections";
import {
  getPhaseCheckState,
  PHASE_CHECK_PASS_MARK,
  PHASE_CHECK_QUESTIONS,
} from "../../../utils/phaseCheck";
import type { RoadmapStepRef } from "../../../utils/roadmapSteps";
import { getResourceProgress, getStepStatus } from "../../../utils/stepStatus";

/** The bubble keeps itself on screen when a stop low on the page opens it. */
const useScrollIntoView = (key: string) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [key]);
  return ref;
};

/** The step's first line of copy — what the bubble says it is about. */
const leadLine = (description: string | undefined) => {
  if (!description) return null;
  const first = parseDescriptionSections(description)[0]?.lines[0];
  return first ? first.replace(/^- /, "") : null;
};

interface RoadmapStepBubbleProps {
  stepRef: RoadmapStepRef;
  pointerOffset: number;
  lessons: YouTubeLessonResult[];
  onOpenLesson: () => void;
  onOpenMaterials: () => void;
  onPractice: (exerciseId: string) => void;
  onPlaySong: (songId: string) => void;
  /** The owner's refine menu, in refine mode. */
  refineMenu?: ReactNode;
}

/**
 * What a tapped step on the road offers: where it sits, one line on what it
 * is, how much of its kit is ticked, and the ways in. The lesson is the main
 * way; the exercise (or the song) can be started right here.
 */
export const RoadmapStepBubble: React.FC<RoadmapStepBubbleProps> = ({
  stepRef,
  pointerOffset,
  lessons,
  onOpenLesson,
  onOpenMaterials,
  onPractice,
  onPlaySong,
  refineMenu,
}) => {
  const { t } = useTranslation("ai_coach");
  const { step, phase, phaseIdx, stepIdx } = stepRef;
  const ref = useScrollIntoView(step.id);
  const lead = leadLine(step.description);
  const resources = getResourceProgress(step, lessons);
  const isDone = getStepStatus(step) === "done";
  const exerciseId =
    step.suggestedExerciseId && !step.noExercise
      ? step.suggestedExerciseId
      : null;
  const song = step.suggestedSong;

  const playKey = song ? (
    <Button
      size='lg'
      variant='subtle'
      className='px-3'
      onClick={() => onPlaySong(song.id)}>
      <Music />
      {t("road.play_song")}
    </Button>
  ) : exerciseId ? (
    <Button
      size='lg'
      variant='subtle'
      className='px-3'
      onClick={() => onPractice(exerciseId)}>
      <Play className='fill-current' />
      {t("road.practice")}
    </Button>
  ) : null;
  const materialsKey =
    resources.total > 0 ? (
      <Button
        size='lg'
        variant='subtle'
        className='px-3'
        onClick={onOpenMaterials}>
        <ListChecks />
        {t("road.materials")}
      </Button>
    ) : null;

  return (
    <div ref={ref} className='scroll-my-6 px-2'>
      <BubbleFrame pointerOffset={pointerOffset}>
        {refineMenu && (
          <div className='absolute right-2 top-2'>{refineMenu}</div>
        )}
        <p className='text-xs font-medium text-zinc-500'>
          {t("phase_n", { n: phaseIdx + 1 })} ·{" "}
          {t("drawer.step_of", {
            step: stepIdx + 1,
            total: phase.steps.length,
          })}
        </p>
        <h3 className='mt-1 font-display text-xl font-bold leading-tight text-zinc-50 [text-wrap:balance]'>
          {step.title}
        </h3>
        {lead && (
          <p className='mt-1.5 line-clamp-3 text-sm leading-relaxed text-zinc-400'>
            {lead}
          </p>
        )}
        {resources.total > 0 && (
          <p className='mt-2 text-xs tabular-nums text-zinc-500'>
            {t("drawer.resources", {
              done: resources.completed,
              total: resources.total,
            })}
          </p>
        )}

        <Button size='lg' className='mt-4 w-full' onClick={onOpenLesson}>
          <BookOpen />
          {isDone ? t("road.read_again") : t("road.open_lesson")}
        </Button>
        {(playKey || materialsKey) && (
          <div
            className={
              playKey && materialsKey
                ? "mt-2 grid grid-cols-2 gap-2"
                : "mt-2 grid"
            }>
            {playKey}
            {materialsKey}
          </div>
        )}
      </BubbleFrame>
    </div>
  );
};

interface RoadmapCheckpointBubbleProps {
  phase: RoadmapPhase;
  phaseIdx: number;
  pointerOffset: number;
  onOpen: () => void;
}

/** A phase's checkpoint on the road: what it asks, and whether it is open yet. */
export const RoadmapCheckpointBubble: React.FC<
  RoadmapCheckpointBubbleProps
> = ({ phase, phaseIdx, pointerOffset, onOpen }) => {
  const { t } = useTranslation("ai_coach");
  const ref = useScrollIntoView(phase.id);
  const state = getPhaseCheckState(phase);
  const done = phase.steps.filter((s) => getStepStatus(s) === "done").length;

  return (
    <div ref={ref} className='scroll-my-6 px-2'>
      <BubbleFrame pointerOffset={pointerOffset}>
        <p className='text-xs font-medium text-zinc-500'>
          {t("phase_n", { n: phaseIdx + 1 })} · {phase.title}
        </p>
        <h3 className='mt-1 font-display text-xl font-bold leading-tight text-zinc-50 [text-wrap:balance]'>
          {t("checkpoint.show_what", { phase: phaseIdx + 1 })}
        </h3>
        <p className='mt-1.5 text-sm leading-relaxed text-zinc-400'>
          {state === "passed" && phase.check
            ? t("road.passed_score", {
                score: phase.check.bestScore,
                total: phase.check.total,
              })
            : t("road.checkpoint_body", {
                count: PHASE_CHECK_QUESTIONS,
                pass: PHASE_CHECK_PASS_MARK,
              })}
        </p>
        <Button
          size='lg'
          className='mt-4 w-full'
          disabled={state === "locked"}
          onClick={onOpen}>
          <ClipboardCheck />
          {t("road.take_check")}
        </Button>
        {state === "locked" && (
          <p className='mt-2 text-xs text-zinc-500'>
            {t("road.checkpoint_locked", { done, total: phase.steps.length })}
          </p>
        )}
      </BubbleFrame>
    </div>
  );
};
