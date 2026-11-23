import { Button } from "assets/components/ui/button";
import {
  BuilderFrame,
  BuilderHeading,
} from "feature/supporterPanel/components/roadmapBrief/BuilderFrame";
import type { SkeletonPhaseView } from "feature/supporterPanel/types/roadmapJob.types";
import { useTranslation } from "hooks/useTranslation";
import { MAX_FEEDBACK_LENGTH } from "lib/roadmaps/generation/jobPlan";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

interface PlanApprovalProps {
  skeleton: SkeletonPhaseView[];
  /** Whether the free round of changes is still there to use. */
  feedbackLeft: boolean;
  tokensLeft?: number;
  /** Resolves false when the answer did not get through. */
  onAnswer: (feedback?: string) => Promise<boolean>;
  onClose: () => void;
}

/**
 * The plan, before the slow part is written: every phase and the steps in it,
 * by title. The player says yes, or — once, free — what to change; the
 * descriptions and the lessons are then written for the plan they agreed to,
 * instead of being paid for step by step afterwards.
 */
export const PlanApproval = ({
  skeleton,
  feedbackLeft,
  tokensLeft,
  onAnswer,
  onClose,
}: PlanApprovalProps) => {
  const { t } = useTranslation("supporter");
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const wantsChanges = feedbackLeft && feedback.trim().length > 0;
  const stepCount = skeleton.reduce(
    (sum, phase) => sum + phase.steps.length,
    0,
  );

  const answer = async (note?: string) => {
    setSending(true);
    setFailed(false);
    const ok = await onAnswer(note);
    setSending(false);
    if (!ok) setFailed(true);
  };

  return (
    <BuilderFrame
      progress={0.5}
      onClose={onClose}
      tokensLeft={tokensLeft}
      note={failed ? t("panel.approval.failed") : t("panel.approval.note")}
      actions={
        <>
          {wantsChanges && (
            <Button
              type='button'
              variant='ghost'
              size='lg'
              disabled={sending}
              onClick={() => void answer()}>
              {t("panel.approval.keep")}
            </Button>
          )}
          <Button
            type='button'
            size='lg'
            disabled={sending}
            onClick={() =>
              void answer(wantsChanges ? feedback.trim() : undefined)
            }>
            {wantsChanges
              ? t("panel.approval.change")
              : t("panel.approval.approve")}
            <ArrowRight size={16} />
          </Button>
        </>
      }>
      <div className='space-y-8'>
        <BuilderHeading
          title={t("panel.approval.title")}
          hint={t("panel.approval.body", {
            phases: skeleton.length,
            steps: stepCount,
          })}
        />

        <ol className='space-y-3'>
          {skeleton.map((phase, index) => (
            <li
              key={`${index}-${phase.title}`}
              className='rounded-lg bg-zinc-900/60 px-5 py-4'>
              <p className='flex items-baseline gap-3 text-base font-semibold text-zinc-100'>
                <span className='text-sm tabular-nums text-zinc-500'>
                  {index + 1}
                </span>
                {phase.title}
              </p>
              <ul className='mt-3 space-y-1.5 pl-6'>
                {phase.steps.map((step, stepIndex) => (
                  <li
                    key={`${stepIndex}-${step}`}
                    className='text-sm leading-relaxed text-zinc-400'>
                    {step}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        {feedbackLeft && (
          <div className='space-y-2.5'>
            <label
              htmlFor='roadmap-plan-feedback'
              className='block text-sm font-semibold text-zinc-300'>
              {t("panel.approval.feedback_label")}
            </label>
            <div className='rounded-lg bg-zinc-800/60 focus-within:ring-1 focus-within:ring-zinc-500'>
              <textarea
                id='roadmap-plan-feedback'
                rows={3}
                maxLength={MAX_FEEDBACK_LENGTH}
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder={t("panel.approval.feedback_placeholder")}
                className='block w-full resize-none bg-transparent px-4 py-3.5 text-base leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-500'
              />
            </div>
          </div>
        )}
      </div>
    </BuilderFrame>
  );
};
