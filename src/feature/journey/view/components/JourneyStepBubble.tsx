import { Button } from "assets/components/ui/button";
import { BubbleFrame } from "feature/whatNext/components/StepBubble";
import { useTranslation } from "hooks/useTranslation";
import { BookOpen, Play, Star, Target } from "lucide-react";
import React, { useEffect, useRef } from "react";

import type { JourneyStepWithStatus } from "../../types/journey.types";
import { buildLessonPages } from "../../utils/lessonPages";

interface JourneyStepBubbleProps {
  step: JourneyStepWithStatus;
  /** Sideways shift of the pointer, so it sits under its stop. */
  pointerOffset: number;
  onOpenLesson: () => void;
  onPractice: () => void;
  onExam: () => void;
}

/**
 * What a tapped step on the road offers: its name, one line on what it
 * teaches, and the ways in. The lesson is always the main way; a step with an
 * exercise also offers Practice and Exam right here, without reading first.
 */
export const JourneyStepBubble: React.FC<JourneyStepBubbleProps> = ({
  step,
  pointerOffset,
  onOpenLesson,
  onPractice,
  onExam,
}) => {
  const { t } = useTranslation("journey");
  const ref = useRef<HTMLDivElement>(null);
  const pages = buildLessonPages(step).length;
  const isNew = step.status === "available";
  const isCompleted = step.status === "completed";

  // A stop low on the screen would open its bubble below the fold.
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [step.id]);

  const lessonLabel = t(isNew ? "lesson.open" : "lesson.read_again", {
    count: pages,
  });

  return (
    <div ref={ref} className='scroll-my-6 px-2'>
      <BubbleFrame pointerOffset={pointerOffset}>
        <p className='flex items-center justify-center gap-2 text-xs font-medium text-zinc-500'>
          {t("sidebar.step", { n: step.order })}
          {isCompleted && step.stars && (
            <span
              className='flex items-center gap-0.5'
              aria-label={`${step.stars}/3`}>
              {[1, 2, 3].map((n) => (
                <Star
                  key={n}
                  size={11}
                  className={
                    n <= step.stars!
                      ? "fill-current text-amber-400"
                      : "text-zinc-700"
                  }
                />
              ))}
            </span>
          )}
        </p>
        <h3 className='mt-1 font-display text-xl font-bold leading-tight text-zinc-50 [text-wrap:balance]'>
          {step.title}
        </h3>
        <p className='mt-1.5 text-sm leading-relaxed text-zinc-400'>
          {step.shortDescription}
        </p>

        <Button size='lg' className='mt-4 w-full' onClick={onOpenLesson}>
          <BookOpen />
          {lessonLabel}
        </Button>
        {!step.modalOnly && (
          <div className='mt-2 grid grid-cols-2 gap-2'>
            <Button
              size='lg'
              variant='subtle'
              className='px-3'
              onClick={onPractice}>
              <Play className='fill-current' />
              {t("sidebar.practice")}
            </Button>
            <Button
              size='lg'
              variant='subtle'
              className='px-3'
              onClick={onExam}>
              <Target />
              {isCompleted ? t("sidebar.retake") : t("sidebar.exam")}
            </Button>
          </div>
        )}
      </BubbleFrame>
    </div>
  );
};
