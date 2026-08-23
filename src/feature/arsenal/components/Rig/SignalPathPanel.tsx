import { cn } from "assets/lib/utils";
import { CurrencyIcon } from "components/CurrencyIcons/withCurrencyIcons";
import { Cable, Lightbulb, Zap } from "lucide-react";

import {
  CHAIN_TIERS,
  type ChainVerdict,
  PLAYABLE_SIGNAL_STAGES,
  SIGNAL_STAGES,
} from "../../data/signalChain";
import { CountUp, Pop } from "../Workshop/workshopMotion";

/**
 * What the board's wiring is worth, and what to do about it.
 *
 * It sits directly above the pedalboard and reads the *live* board rather than
 * the saved one, so the verdict and the Fame rate move under the player's hand
 * while a pedal is still being dragged. That immediacy is the feature: the rule
 * being taught here — the order effects belong in — is one nobody reads a wiki
 * page for, but everybody notices when the number climbs as the pedal lands.
 *
 * Three things, in the order a player needs them: what the board is (the
 * verdict and the rate), how far off it is (a bar per cable), and what to do
 * next (the tip, with the button that does it). The ladder underneath is the
 * reference chart — the only part of the panel that stays the same whatever is
 * on the board.
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
  why: string;
  filled: boolean;
}

const StageChip = ({ label, why, filled }: StageChipProps) => (
  <span
    title={why}
    className={cn(
      "cursor-default rounded px-2 py-1 text-[11px] tracking-wide transition-colors",
      filled ? "bg-zinc-800 text-zinc-200" : "bg-zinc-900/60 text-zinc-600",
    )}>
    {label}
  </span>
);

interface SignalPathPanelProps {
  verdict: ChainVerdict;
  /** Lays the board out in the order the craft asks for. */
  onWireUp?: () => void;
}

export const SignalPathPanel = ({ verdict, onWireUp }: SignalPathPanelProps) => {
  const tier = CHAIN_TIERS[verdict.tier];
  const tone = TONES[tier.tone];
  const filled = new Set(verdict.filledStages);

  // The stage of the pedal the tip asks the player to move — worth spelling out,
  // because the reason a Reverb goes last is the part that stays with them.
  const firstWrong = verdict.links.find((link) => !link.ok);
  const why =
    firstWrong !== undefined
      ? SIGNAL_STAGES[verdict.nodes[firstWrong.to].stage]?.why
      : undefined;

  return (
    <div className='flex flex-col gap-6 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
      <div className='flex flex-wrap items-start justify-between gap-x-8 gap-y-4'>
        <div className='flex flex-col gap-1.5'>
          <p className='flex items-center gap-1.5 text-[9px] font-bold capitalize tracking-[0.2em] text-zinc-500'>
            <Cable size={11} strokeWidth={2.5} />
            Signal Path
          </p>
          <Pop trigger={tier.label}>
            <p
              className={cn(
                "text-2xl font-black capitalize tracking-wide",
                tone.text,
              )}>
              {tier.label}
            </p>
          </Pop>
          <p className='max-w-md text-xs leading-relaxed text-zinc-400'>
            {tier.note}
          </p>
        </div>

        <div className='flex flex-col items-start gap-1 sm:items-end'>
          <div className='flex items-baseline gap-1.5'>
            <CurrencyIcon
              currency='fame'
              className='mr-0 h-6 w-6 self-center'
            />
            <CountUp
              value={verdict.rate}
              decimals={1}
              prefix='+'
              className='font-teko text-5xl font-bold leading-none tabular-nums text-amber-300'
            />
            <span className='font-teko text-lg leading-none text-amber-500/70'>
              /h
            </span>
          </div>
          <p className='text-[11px] tracking-wide text-zinc-500'>
            Wiring bonus
          </p>
        </div>
      </div>

      {verdict.links.length > 0 && (
        <div className='flex flex-col gap-2'>
          <div className='flex items-center gap-1.5'>
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
            {verdict.links.length === 1 ? "cable" : "cables"} run into the pedal
            that belongs next
          </p>
        </div>
      )}

      {verdict.tip && (
        <div className='flex flex-wrap items-center justify-between gap-x-6 gap-y-3'>
          <div className='flex min-w-0 flex-col gap-1'>
            <p className='flex items-start gap-2 text-[13px] leading-relaxed text-zinc-200'>
              <Lightbulb
                size={14}
                className='mt-0.5 shrink-0 text-amber-400'
              />
              {verdict.tip}
            </p>
            {why && <p className='pl-6 text-xs text-zinc-500'>{why}</p>}
          </div>

          {onWireUp && (
            <button
              onClick={onWireUp}
              className='flex shrink-0 items-center gap-1.5 rounded bg-amber-500/15 px-3.5 py-2 text-[10px] font-black capitalize tracking-[0.2em] text-amber-300 transition-colors hover:bg-amber-500/25 hover:text-amber-200'
              title='Lay the whole board out in the order the craft asks for'>
              <Zap size={11} strokeWidth={2.5} />
              Wire It Up
            </button>
          )}
        </div>
      )}

      <div className='flex flex-col gap-2.5'>
        <p className='text-[9px] font-bold capitalize tracking-[0.2em] text-zinc-500'>
          Guitar → Amp
        </p>
        <div className='flex flex-wrap items-center gap-x-1 gap-y-1.5'>
          {PLAYABLE_SIGNAL_STAGES.map((stage, index) => (
            <div key={stage.id} className='flex items-center gap-1'>
              {index > 0 && (
                <span className='text-[11px] text-zinc-700'>→</span>
              )}
              <StageChip
                label={stage.label}
                why={stage.why}
                filled={filled.has(SIGNAL_STAGES.indexOf(stage))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
