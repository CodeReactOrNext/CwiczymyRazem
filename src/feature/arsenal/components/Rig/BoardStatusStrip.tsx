import { cn } from "assets/lib/utils";
import { AlertTriangle, Sparkles } from "lucide-react";

import type { PowerState } from "../../data/powerSupply";
import type { SupplyTier } from "../../data/rigHardware";
import { CHAIN_TIERS, type ChainVerdict } from "../../data/signalChain";
import { CountUp, Pop } from "../Workshop/workshopMotion";

/**
 * The two readouts over the board, side by side on one line each: what the
 * wiring is worth and whether the brick has a hole left.
 *
 * Both read the *live* board rather than the saved one, so the verdict and the
 * numbers move under the player's hand while a pedal is still being dragged.
 * That immediacy is the whole strip: a number climbing as the pedal lands
 * teaches the rule faster than a paragraph would.
 *
 * Each panel is a lamp, a headline and, on the right, the one detail that
 * explains the lamp. The fixes live on the buttons in the section heading —
 * "Wire it up", "Patch power" — not in tips beside the readouts.
 */

/** Lamp colours: the same four the cables and the verdict already use. */
const LAMP = {
  good: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]",
  warn: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]",
  // Red rather than a palette accent, and deliberately: this board already uses
  // red for a pedal that cannot go where it is being dropped, so a cable running
  // backwards had better be the same red.
  bad: "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.7)]",
  idle: "bg-zinc-600",
} as const;

const Lamp = ({ tone }: { tone: keyof typeof LAMP }) => (
  <span
    aria-hidden
    className={cn("h-2 w-2 shrink-0 rounded-full", LAMP[tone])}
  />
);

interface PanelProps {
  label: string;
  children: React.ReactNode;
  /** The right-hand detail. */
  aside?: React.ReactNode;
}

const Panel = ({ label, children, aside }: PanelProps) => (
  <div className='flex min-h-[3.25rem] flex-wrap items-center gap-x-5 gap-y-2 rounded-lg bg-arsenal-section px-5 py-3'>
    <span className='text-sm font-semibold text-arsenal-text-primary'>
      {label}
    </span>
    <div className='flex items-center gap-2.5'>{children}</div>
    {aside && (
      <div className='ml-auto flex flex-wrap items-center gap-4 text-xs'>
        {aside}
      </div>
    )}
  </div>
);

interface BoardStatusStripProps {
  verdict: ChainVerdict;
  /** The brick the rig owns — what the power numbers are measured against. */
  supply: SupplyTier;
  power: PowerState;
  /** Names of the boarded pedals with no cable to the brick. */
  unpowered: string[];
}

export const BoardStatusStrip = ({
  verdict,
  supply,
  power,
  unpowered,
}: BoardStatusStripProps) => {
  const tier = CHAIN_TIERS[verdict.tier];
  const cables = verdict.links.length;

  // Capacity turns amber on the last output. A boarded pedal with nothing
  // feeding it is the more specific problem, so it takes the lamp to red and
  // gets named on the right.
  const powerTone =
    unpowered.length > 0 ? "bad" : power.outputsFree === 0 ? "warn" : "good";

  return (
    <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
      <Panel
        label='Signal path'
        aside={
          cables > 0 ? (
            <>
              <span className='tabular-nums text-arsenal-text-tertiary'>
                {verdict.okLinks} / {cables} in order
              </span>
              {verdict.wrongLinks > 0 && (
                <span className='flex items-center gap-1.5 font-semibold text-amber-400'>
                  <AlertTriangle size={13} strokeWidth={2.5} />
                  {verdict.wrongLinks} backwards
                </span>
              )}
              {verdict.complete && (
                <span className='flex items-center gap-1.5 font-semibold text-emerald-400'>
                  <Sparkles size={13} strokeWidth={2.5} />
                  Full chain
                </span>
              )}
            </>
          ) : (
            <span className='text-arsenal-text-tertiary'>{tier.note}</span>
          )
        }>
        <Lamp tone={tier.tone} />
        <Pop trigger={tier.label}>
          <span className='text-sm font-semibold capitalize text-arsenal-text-primary'>
            {tier.label}
          </span>
        </Pop>
        <span className='text-arsenal-text-tertiary'>·</span>
        <span className='flex items-baseline gap-0.5 text-sm font-bold tabular-nums text-amber-300'>
          <CountUp value={verdict.rate} decimals={1} prefix='+' />
          <span className='text-xs font-semibold text-amber-500/70'>/h</span>
        </span>
      </Panel>

      <Panel
        label='Power'
        aside={
          unpowered.length > 0 ? (
            <span className='flex items-center gap-1.5 font-semibold text-red-400'>
              <AlertTriangle size={13} strokeWidth={2.5} />
              {unpowered[0]} needs power
              {unpowered.length > 1 && (
                <span className='font-normal text-red-400/70'>
                  {" "}
                  and {unpowered.length - 1} more
                </span>
              )}
            </span>
          ) : (
            <span className='text-arsenal-text-tertiary'>
              {power.outputsUsed === 0
                ? "Nothing plugged in yet"
                : "Every pedal is running"}
            </span>
          )
        }>
        <Lamp tone={powerTone} />
        <span className='text-sm font-semibold tabular-nums text-arsenal-text-primary'>
          {power.outputsUsed} / {supply.outputs} outputs
        </span>
        <span className='hidden text-xs text-arsenal-text-tertiary sm:inline'>
          {supply.name}
        </span>
      </Panel>
    </div>
  );
};
