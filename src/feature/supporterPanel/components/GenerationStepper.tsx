import { cn } from "assets/lib/utils";
import { BuilderProgressBar } from "feature/supporterPanel/components/roadmapBrief/BuilderFrame";
import type { GenerationStage } from "feature/supporterPanel/types/roadmapJob.types";
import { useTranslation } from "hooks/useTranslation";
import type { Translate } from "lib/i18n/translate";
import { Check } from "lucide-react";
import React from "react";

/** Title and "doing" line are `supporter:panel.stepper.blocks.<id>`. */
const BLOCKS = ["draft", "review", "phases", "lessons", "ready"] as const;

type BlockId = (typeof BLOCKS)[number];

const blockOf = (stage: GenerationStage | null): number => {
  if (!stage) return 0;
  switch (stage.name) {
    case "structure":
      return stage.step === "draft" ? 0 : 1;
    case "approval":
      return 2;
    case "phase":
      return 2;
    case "lessons":
      return stage.done >= stage.total ? 4 : 3;
    default:
      return 0;
  }
};

/** The line beside the running block: a count where there is one, a verb otherwise. */
const detailOf = (
  t: Translate,
  stage: GenerationStage | null,
  block: BlockId,
): string => {
  const doing = t(`panel.stepper.blocks.${block}.doing`);
  if (!stage) return doing;
  if (stage.name === "structure" && block === "review") {
    return stage.step === "revise" ? t("panel.stepper.revising") : doing;
  }
  if (stage.name === "phase" && block === "phases") {
    return t("panel.stepper.written", { done: stage.done, total: stage.total });
  }
  if (stage.name === "lessons" && block === "lessons") {
    return t("panel.stepper.steps", { done: stage.done, total: stage.total });
  }
  return doing;
};

interface GenerationStepperProps {
  stage: GenerationStage | null;
  /** 0–100, the crawling bar over the list. */
  progress: number;
  className?: string;
}

/**
 * Where the generation is: one bar, and under it the five things the coach
 * does in order — ticked, running, still to come. A bar alone says "some way
 * through"; the list says "the phases are being written, three of seven so
 * far, then lessons, then done" — which is what somebody watching for four
 * minutes actually wants to know.
 */
export const GenerationStepper: React.FC<GenerationStepperProps> = ({
  stage,
  progress,
  className,
}) => {
  const { t } = useTranslation("supporter");
  const current = blockOf(stage);

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className='flex items-center gap-3.5'>
        <BuilderProgressBar
          value={progress / 100}
          label={t("panel.generate.writing")}
        />
        <span className='text-sm font-semibold tabular-nums text-zinc-300'>
          {Math.round(progress)}%
        </span>
      </div>

      <ol className='flex flex-col gap-1'>
        {BLOCKS.map((block, index) => {
          const state =
            index < current ? "done" : index === current ? "running" : "next";
          return (
            <li
              key={block}
              aria-current={state === "running" ? "step" : undefined}
              className='flex items-center gap-3.5 py-2.5'>
              <span
                aria-hidden
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  state === "done" && "bg-emerald-500/15 text-emerald-300",
                  state === "running" && "bg-amber-500/15",
                  state === "next" && "bg-zinc-800",
                )}>
                {state === "done" && <Check size={14} strokeWidth={3.5} />}
                {state === "running" && (
                  <span className='h-2.5 w-2.5 animate-pulse rounded-full bg-amber-400' />
                )}
              </span>
              <span
                className={cn(
                  "flex-1 text-base font-semibold",
                  state === "next" ? "text-zinc-500" : "text-zinc-100",
                )}>
                {t(`panel.stepper.blocks.${block}.title`)}
              </span>
              <span
                className={cn(
                  "text-sm tabular-nums",
                  state === "running" ? "text-amber-200" : "text-zinc-500",
                )}>
                {state === "done"
                  ? t("panel.stepper.done")
                  : state === "running"
                    ? detailOf(t, stage, block)
                    : null}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
