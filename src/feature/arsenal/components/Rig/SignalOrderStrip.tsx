import { cn } from "assets/lib/utils";
import { ChevronRight } from "lucide-react";

import type { BoardLevel } from "../../data/boardDuplicates";
import {
  CHAIN_COMPLETE_FAME,
  type ChainVerdict,
  PLAYABLE_SIGNAL_STAGES,
  readStageLevels,
  SIGNAL_STAGES,
  type StageLevel,
} from "../../data/signalChain";

/**
 * The chain as the craft lays it out: every kind of pedal in the order the
 * signal should meet them, which of those kinds this rig runs, and what each
 * of them is worth.
 *
 * A lit chip is a stage the board covers, a dim one is a stage the rig has yet
 * to own — so the strip reads as a checklist of what to hunt for next, not as
 * a list of what is already there. A stage on the wrong end of a backwards
 * cable turns amber, which is how the strip points at the pedal the "Wire it
 * up" button is about to move. Why each stage sits where it does is on hover.
 *
 * The level beside each filled stage is the second question the strip answers.
 * "Do I own a delay?" runs out as a useful question early; "which of these
 * eleven is the one holding my rig back?" never does, and it is the same row
 * of chips either way. Levels are the counted ones (`readStageLevels`), so
 * they add up to the Rig Level on the sheet above rather than to a number that
 * appears nowhere else.
 */

/** The one line the tooltip adds under the stage's reason for being here. */
const describeStageLevel = (at: StageLevel | undefined): string => {
  if (!at) return "Nothing of this kind is in service.";
  const pedals = at.count === 1 ? "1 pedal" : `${at.count} pedals`;
  const lost =
    at.penalty > 0 ? ` (${at.penalty} lost to a duplicate copy)` : "";
  return `${pedals} in service, worth Lv ${at.level} of your Rig Level${lost}.`;
};

interface SignalOrderStripProps {
  verdict: ChainVerdict;
  /** The same priced board the duplicate readouts use. */
  board: BoardLevel;
}

export const SignalOrderStrip = ({ verdict, board }: SignalOrderStripProps) => {
  const filled = new Set(verdict.filledStages);
  const levels = readStageLevels(verdict, board);
  const stagesLeft = PLAYABLE_SIGNAL_STAGES.length - filled.size;

  // A stage is at fault when a pedal of that kind sits on either end of a
  // cable that runs backwards.
  const faulted = new Set<number>();
  for (const link of verdict.links) {
    if (link.ok) continue;
    faulted.add(verdict.nodes[link.from]?.stage ?? -1);
    faulted.add(verdict.nodes[link.to]?.stage ?? -1);
  }

  return (
    <div className='flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-arsenal-section px-5 py-3'>
      <span className='text-sm font-semibold text-arsenal-text-primary'>
        Signal order
      </span>

      {/* Named whether or not it is being paid. A badge that only appears once
          the bonus is earned can never teach anybody it is there to earn, and
          this is the one chain bonus no amount of rearranging can reach — the
          pedals have to be hunted for. So the dim state carries the number and
          the distance left to it. */}
      <span
        title={
          verdict.complete
            ? `Every stage is in service. The board pays ${CHAIN_COMPLETE_FAME} Fame an hour on top of its cables.`
            : `Cover every stage at once and the board pays ${CHAIN_COMPLETE_FAME} Fame an hour on top of its cables.`
        }
        className={cn(
          "flex shrink-0 cursor-default items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold",
          verdict.complete
            ? "bg-emerald-400/10 text-emerald-300"
            : "bg-arsenal-card text-arsenal-text-tertiary",
        )}>
        Full chain
        <span className='tabular-nums text-amber-300'>
          +{CHAIN_COMPLETE_FAME}/h
        </span>
        {!verdict.complete && (
          <span className='font-medium text-arsenal-text-tertiary'>
            · {stagesLeft} to go
          </span>
        )}
      </span>

      <div className='no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto'>
        {PLAYABLE_SIGNAL_STAGES.map((stage, index) => {
          const stageIndex = SIGNAL_STAGES.indexOf(stage);
          const has = filled.has(stageIndex);
          const wrong = has && faulted.has(stageIndex);
          const at = levels.get(stageIndex);
          return (
            <span key={stage.id} className='flex shrink-0 items-center gap-1.5'>
              {index > 0 && (
                <ChevronRight
                  size={14}
                  className='shrink-0 text-arsenal-text-tertiary/60'
                  aria-hidden
                />
              )}
              <span
                title={`${stage.why}\n\n${describeStageLevel(at)}`}
                className={cn(
                  "flex cursor-default items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  wrong
                    ? "bg-amber-400/10 text-amber-300 ring-1 ring-inset ring-amber-400/50"
                    : has
                      ? "bg-arsenal-card text-arsenal-text-secondary"
                      : "text-arsenal-text-tertiary",
                )}>
                {stage.label}
                {/* An empty stage carries no number at all: a "0" beside ten
                    real levels reads as a pedal worth nothing rather than as a
                    pedal the rig has never owned. */}
                {at && (
                  <span
                    className={cn(
                      "font-mono text-[11px] font-semibold tabular-nums",
                      wrong ? "text-amber-200/80" : "text-zinc-400",
                    )}>
                    {at.level}
                  </span>
                )}
                <span
                  aria-hidden
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    wrong
                      ? "bg-amber-400"
                      : has
                        ? "bg-emerald-400"
                        : "bg-zinc-700",
                  )}
                />
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
};
