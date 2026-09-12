import { cn } from "assets/lib/utils";
import { ChevronRight } from "lucide-react";

import {
  type ChainVerdict,
  PLAYABLE_SIGNAL_STAGES,
  SIGNAL_STAGES,
} from "../../data/signalChain";

/**
 * The chain as the craft lays it out: every kind of pedal in the order the
 * signal should meet them, and which of those kinds this rig runs.
 *
 * A lit chip is a stage the board covers, a dim one is a stage the rig has yet
 * to own — so the strip reads as a checklist of what to hunt for next, not as
 * a list of what is already there. A stage on the wrong end of a backwards
 * cable turns amber, which is how the strip points at the pedal the "Wire it
 * up" button is about to move. Why each stage sits where it does is on hover.
 */

interface SignalOrderStripProps {
  verdict: ChainVerdict;
}

export const SignalOrderStrip = ({ verdict }: SignalOrderStripProps) => {
  const filled = new Set(verdict.filledStages);

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

      {verdict.complete && (
        <span className='rounded-md bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300'>
          Full chain
        </span>
      )}

      <div className='no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto'>
        {PLAYABLE_SIGNAL_STAGES.map((stage, index) => {
          const stageIndex = SIGNAL_STAGES.indexOf(stage);
          const has = filled.has(stageIndex);
          const wrong = has && faulted.has(stageIndex);
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
                title={stage.why}
                className={cn(
                  "flex cursor-default items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  wrong
                    ? "bg-amber-400/10 text-amber-300 ring-1 ring-inset ring-amber-400/50"
                    : has
                      ? "bg-arsenal-card text-arsenal-text-secondary"
                      : "text-arsenal-text-tertiary",
                )}>
                {stage.label}
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
