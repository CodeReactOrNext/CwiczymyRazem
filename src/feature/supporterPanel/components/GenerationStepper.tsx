import { cn } from "assets/lib/utils";
import type { GenerationStage } from "feature/supporterPanel/types/roadmapJob.types";
import { Check, ClipboardCheck, FileText, Flag, Layers } from "lucide-react";
import React from "react";
import { FaYoutube } from "react-icons/fa6";

type BlockId = "draft" | "review" | "phases" | "lessons" | "ready";

interface Block {
  id: BlockId;
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  /** What the block does, for the one that is running. */
  doing: string;
}

const BLOCKS: Block[] = [
  { id: "draft", Icon: FileText, title: "Draft", doing: "Sketching the plan" },
  {
    id: "review",
    Icon: ClipboardCheck,
    title: "Review",
    doing: "Getting it reviewed",
  },
  { id: "phases", Icon: Layers, title: "Phases", doing: "Writing every step" },
  {
    id: "lessons",
    Icon: FaYoutube,
    title: "Lessons",
    doing: "Finding lessons",
  },
  { id: "ready", Icon: Flag, title: "Ready", doing: "Saving your roadmap" },
];

const blockOf = (stage: GenerationStage | null): number => {
  if (!stage) return 0;
  switch (stage.name) {
    case "structure":
      return stage.step === "draft" ? 0 : 1;
    case "phase":
      return 2;
    case "lessons":
      return stage.done >= stage.total ? 4 : 3;
    default:
      return 0;
  }
};

/** The line under the running block: a count where there is one, a verb otherwise. */
const detailOf = (stage: GenerationStage | null, block: Block): string => {
  if (!stage) return block.doing;
  if (stage.name === "structure" && block.id === "review") {
    return stage.step === "revise" ? "Rewriting after notes" : block.doing;
  }
  if (stage.name === "phase" && block.id === "phases") {
    return `${stage.done} of ${stage.total} written`;
  }
  if (stage.name === "lessons" && block.id === "lessons") {
    return `${stage.done} of ${stage.total} steps`;
  }
  return block.doing;
};

interface GenerationStepperProps {
  stage: GenerationStage | null;
  /** 0–100, the crawling bar under the blocks. */
  progress: number;
  className?: string;
}

/**
 * Where the generation is, as five blocks the eye can count: what is done,
 * what is running, what is still to come. A single bar says "some way
 * through"; the blocks say "the phases are being written, three of seven so
 * far, then lessons, then done" — which is what somebody staring at a tab for
 * four minutes actually wants to know.
 */
export const GenerationStepper: React.FC<GenerationStepperProps> = ({
  stage,
  progress,
  className,
}) => {
  const current = blockOf(stage);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <ol className='grid grid-cols-5 gap-1.5 sm:gap-2'>
        {BLOCKS.map((block, index) => {
          const state =
            index < current ? "done" : index === current ? "running" : "next";
          const Icon = block.Icon;
          return (
            <li
              key={block.id}
              aria-current={state === "running" ? "step" : undefined}
              className={cn(
                "flex min-w-0 flex-col items-center gap-2 rounded-lg px-2 py-3 text-center transition-colors sm:px-3 sm:py-4",
                state === "done" && "bg-emerald-950/30 text-emerald-400/80",
                state === "running" && "bg-amber-500/10 text-amber-200",
                state === "next" && "bg-zinc-900/40 text-zinc-500",
              )}>
              <span
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-lg",
                  state === "done" && "bg-emerald-500/15 text-emerald-300",
                  state === "running" && "bg-amber-500/15 text-amber-300",
                  state === "next" && "bg-zinc-800/60 text-zinc-500",
                )}>
                {state === "done" ? (
                  <Check className='h-4 w-4' strokeWidth={3} />
                ) : (
                  <Icon className='h-4 w-4' />
                )}
                {state === "running" && (
                  <span
                    aria-hidden
                    className='absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-amber-400'
                  />
                )}
              </span>
              <span className='flex min-w-0 flex-col items-center gap-0.5'>
                <span className='text-xs font-bold sm:text-sm'>
                  {block.title}
                </span>
                <span
                  className={cn(
                    "hidden text-[11px] leading-tight sm:block",
                    state === "running" ? "text-amber-200/80" : "text-zinc-500",
                  )}>
                  {state === "done"
                    ? "done"
                    : state === "running"
                      ? detailOf(stage, block)
                      : "up next"}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      <div className='flex flex-col gap-2'>
        <div className='flex items-center justify-between gap-3 text-xs'>
          <span className='font-semibold text-zinc-300'>
            Step {current + 1} of {BLOCKS.length} ·{" "}
            <span className='text-amber-200/90'>
              {detailOf(stage, BLOCKS[current])}
            </span>
          </span>
          <span className='tabular-nums text-zinc-500'>
            {Math.round(progress)}%
          </span>
        </div>
        <div className='h-1.5 w-full overflow-hidden rounded-full bg-zinc-800'>
          <div
            className='h-full rounded-full bg-amber-400/80 transition-all duration-500'
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
