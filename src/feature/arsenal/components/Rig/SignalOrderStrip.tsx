import { PRESSABLE } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { CurrencyIcon } from "components/CurrencyIcons/withCurrencyIcons";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import type { Translate } from "lib/i18n/translate";
import { Check } from "lucide-react";
import { useState } from "react";

import type { BoardLevel } from "../../data/boardDuplicates";
import {
  CHAIN_COMPLETE_FAME,
  type ChainVerdict,
  PLAYABLE_SIGNAL_STAGES,
  readStageLevels,
  SIGNAL_STAGES,
  type StageLevel,
} from "../../data/signalChain";
import { RIG_TILE } from "./RigSection";

/**
 * The chain as the craft lays it out, read as progress towards a prize: every
 * kind of pedal in the order the signal should meet them, how many of those
 * kinds this rig runs, and what covering all of them pays.
 *
 * One line and one row. The line counts the stages covered and names the prize
 * for covering them all; the row is the stages themselves, as keys — a raised
 * one with a tick is a stage the board covers, a flat one is a stage the rig
 * has yet to own. A stage on the wrong end of a backwards cable turns orange,
 * which is how the row points at the pedal "Wire it up" is about to move.
 *
 * It says nothing about what is missing beyond that: no count of stages to go,
 * no bar repeating the row above it, no line of instructions. Why a stage sits
 * where it does, and what level it adds to the Rig Level (`readStageLevels`),
 * open under the row only when a stage is pressed.
 */

/** The one line the explanation adds under the stage's reason for being here. */
const describeStageLevel = (
  at: StageLevel | undefined,
  t: Translate,
): string => {
  if (!at) return t("signal.stage_empty");
  const lost =
    at.penalty > 0 ? t("signal.stage_lost", { count: at.penalty }) : "";
  return t("signal.stage_level", { count: at.count, level: at.level, lost });
};

interface SignalOrderStripProps {
  verdict: ChainVerdict;
  /** The same priced board the duplicate readouts use. */
  board: BoardLevel;
}

export const SignalOrderStrip = ({ verdict, board }: SignalOrderStripProps) => {
  const labels = useArsenalLabels();
  const { t } = labels;
  const [openStage, setOpenStage] = useState<string | null>(null);
  const filled = new Set(verdict.filledStages);
  const levels = readStageLevels(verdict, board);
  const total = PLAYABLE_SIGNAL_STAGES.length;

  // A stage is at fault when a pedal of that kind sits on either end of a
  // cable that runs backwards.
  const faulted = new Set<number>();
  for (const link of verdict.links) {
    if (link.ok) continue;
    faulted.add(verdict.nodes[link.from]?.stage ?? -1);
    faulted.add(verdict.nodes[link.to]?.stage ?? -1);
  }

  const stages = PLAYABLE_SIGNAL_STAGES.map((stage) => {
    const stageIndex = SIGNAL_STAGES.indexOf(stage);
    const has = filled.has(stageIndex);
    return {
      stage,
      has,
      wrong: has && faulted.has(stageIndex),
      at: levels.get(stageIndex),
    };
  });
  const open = stages.find(({ stage }) => stage.id === openStage);

  return (
    <div className={cn(RIG_TILE, "flex flex-col gap-5 px-6 py-5")}>
      <div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm text-zinc-400'>
        <p className='flex items-baseline gap-3'>
          {t("signal.full_chain")}
          <span
            role='progressbar'
            aria-label={t("signal.full_chain")}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={filled.size}
            className='text-base font-semibold tabular-nums text-zinc-100'>
            {filled.size} / {total}
          </span>
        </p>
        {/* Named whether or not it is being paid: a prize that only appears
            once it is earned can never teach anybody it is there to earn. */}
        <span
          title={
            verdict.complete
              ? t("signal.full_chain_done", { fame: CHAIN_COMPLETE_FAME })
              : t("signal.full_chain_hint", { fame: CHAIN_COMPLETE_FAME })
          }
          className={cn(
            "flex cursor-default items-center gap-1 font-semibold tabular-nums",
            verdict.complete ? "text-amber-300" : "text-zinc-400",
          )}>
          <CurrencyIcon currency='fame' className='mr-0 h-3.5 w-3.5' />+
          {CHAIN_COMPLETE_FAME}/h
        </span>
      </div>

      {/* Wrapped rather than scrolled: a chain cut off at the edge hides the
          stages at the end of it, which are as much a part of the checklist. */}
      <div className='flex flex-wrap gap-2.5'>
        {stages.map(({ stage, has, wrong }) => (
          <button
            key={stage.id}
            type='button'
            aria-pressed={openStage === stage.id}
            onClick={() =>
              setOpenStage((current) =>
                current === stage.id ? null : stage.id,
              )
            }
            className={cn(
              PRESSABLE,
              "flex items-center gap-1.5 rounded-lg border-b-black/30 px-3.5 py-2 text-sm transition-colors duration-fast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              wrong
                ? "bg-zinc-800 text-orange-300 hover:bg-zinc-700"
                : has
                  ? "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                  : "border-b-transparent bg-transparent font-medium text-zinc-400 hover:bg-zinc-800/60",
              openStage === stage.id && "ring-1 ring-ring",
            )}>
            {has && (
              <Check
                size={13}
                strokeWidth={3}
                className={wrong ? "text-orange-400" : "text-zinc-400"}
                aria-hidden
              />
            )}
            {labels.stageLabel(stage)}
          </button>
        ))}
      </div>

      {open && (
        <p className='text-sm leading-relaxed text-zinc-400'>
          <span className='font-semibold text-zinc-100'>
            {labels.stageLabel(open.stage)}.
          </span>{" "}
          {labels.stageWhy(open.stage)} {describeStageLevel(open.at, t)}
        </p>
      )}
    </div>
  );
};
