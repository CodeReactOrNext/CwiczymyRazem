import { cn } from "assets/lib/utils";
import { CurrencyIcon } from "components/CurrencyIcons/withCurrencyIcons";

import {
  CHAIN_TIERS,
  type ChainVerdict,
  PLAYABLE_SIGNAL_STAGES,
  SIGNAL_STAGES,
} from "../../data/signalChain";
import { CountUp, Pop } from "../Workshop/workshopMotion";

/**
 * What the board's wiring is worth, in one tile.
 *
 * It reads the *live* board rather than the saved one, so the verdict and the
 * rate move under the player's hand while a pedal is still being dragged. That
 * immediacy is the whole panel: the number climbing as the pedal lands teaches
 * the rule faster than the paragraph that used to sit here.
 *
 * One label, one verdict, one rate, one bar per cable, and the chain of stages
 * the board covers — a lit chip is a kind of pedal in service, a dim one is a
 * kind the rig has yet to run. The fix lives on the "Wire it up" button in the
 * section heading, not in a tip beside it.
 */

const TONES = {
  good: { text: "text-emerald-400", bar: "bg-emerald-500/80" },
  warn: { text: "text-amber-400", bar: "bg-amber-500/80" },
  // Red rather than a palette accent, and deliberately: this board already uses
  // red for a pedal that cannot go where it is being dropped, so a cable running
  // backwards had better be the same red.
  bad: { text: "text-red-400", bar: "bg-red-500/80" },
  idle: { text: "text-zinc-300", bar: "bg-zinc-700" },
} as const;

interface StageChipProps {
  label: string;
  /** Why this stage sits where it does — on hover, out of the way. */
  why: string;
  filled: boolean;
}

const StageChip = ({ label, why, filled }: StageChipProps) => (
  <span
    title={why}
    className={cn(
      "cursor-default rounded px-2 py-1 text-[11px] tracking-wide transition-colors",
      filled ? "bg-zinc-800 text-zinc-200" : "text-zinc-500",
    )}>
    {label}
  </span>
);

interface SignalPathPanelProps {
  verdict: ChainVerdict;
}

export const SignalPathPanel = ({ verdict }: SignalPathPanelProps) => {
  const tier = CHAIN_TIERS[verdict.tier];
  const tone = TONES[tier.tone];
  const filled = new Set(verdict.filledStages);

  return (
    <div className='flex flex-col gap-3 rounded-lg bg-zinc-900/40 p-5'>
      <div className='flex items-center justify-between gap-4'>
        <p className='text-[11px] tracking-wide text-zinc-500'>Signal path</p>
        <div className='flex items-baseline gap-1'>
          <CurrencyIcon currency='fame' className='mr-0 h-5 w-5 self-center' />
          <CountUp
            value={verdict.rate}
            decimals={1}
            prefix='+'
            className='font-teko text-3xl font-bold tabular-nums leading-none text-amber-300'
          />
          <span className='font-teko text-base leading-none text-amber-500/70'>
            /h
          </span>
        </div>
      </div>

      <Pop trigger={tier.label}>
        <p
          className={cn(
            "text-xl font-black capitalize tracking-wide",
            tone.text,
          )}>
          {tier.label}
        </p>
      </Pop>

      {verdict.links.length > 0 && (
        <div className='flex flex-col gap-2'>
          <div className='flex items-center gap-1'>
            {verdict.links.map((link, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 flex-1 rounded transition-colors duration-300",
                  link.ok ? TONES.good.bar : TONES.bad.bar,
                )}
              />
            ))}
          </div>
          <p className='text-[11px] tracking-wide text-zinc-500'>
            {verdict.okLinks} of {verdict.links.length}{" "}
            {verdict.links.length === 1 ? "cable" : "cables"} in order
          </p>
        </div>
      )}

      <div className='flex flex-wrap items-center gap-x-0.5 gap-y-1'>
        {PLAYABLE_SIGNAL_STAGES.map((stage, index) => (
          <div key={stage.id} className='flex items-center gap-0.5'>
            {index > 0 && <span className='text-[11px] text-zinc-700'>→</span>}
            <StageChip
              label={stage.label}
              why={stage.why}
              filled={filled.has(SIGNAL_STAGES.indexOf(stage))}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
