import type { MilestoneStatus } from "feature/dashboard/utils/milestoneSummary";
import { Check, Lock } from "lucide-react";

/** "Reached" green, the same one the Milestones page fills its discs with. */
const GREEN = "#22c55e";
const NODE = 56;
const CENTER = NODE / 2;
const RING_R = 23;
const CIRC = 2 * Math.PI * RING_R;

/** A tier is shut either because it was never bought or because the account is too low. */
export const isLockedNode = (status: MilestoneStatus): boolean =>
  !status.owned && (status.cost > 0 || status.lockedAtLvl !== null);

export const isClaimableNode = (status: MilestoneStatus): boolean =>
  status.met && status.owned && !status.claimed;

/**
 * One milestone drawn as the Milestones page draws it: a solid disc carrying
 * the tier's icon, wrapped in a ring that fills with the week's progress. Green
 * and ticked once the goal is met, padlocked and dashed while the tier is shut,
 * and dotted in the corner when a reward is waiting or has been collected.
 *
 * The ring is the progress read-out, which is what lets the card around it stay
 * a single line instead of stacking a separate bar under the text.
 */
export const MilestoneNode = ({
  status,
  isCurrent = false,
}: {
  status: MilestoneStatus;
  /** The goal being worked towards right now — drawn with a halo. */
  isCurrent?: boolean;
}) => {
  const locked = isLockedNode(status);
  const claimable = isClaimableNode(status);
  const ringColor = status.met ? GREEN : status.color;
  const percent =
    status.progress.max > 0 ? status.progress.value / status.progress.max : 0;
  const stroke = isCurrent ? 4 : 3;
  const Icon = status.Icon;

  return (
    <div
      className='relative flex shrink-0 items-center justify-center rounded-full'
      style={{ width: NODE, height: NODE }}>
      {isCurrent && (
        <span
          aria-hidden
          className='absolute inset-[-4px] rounded-full'
          style={{
            boxShadow: `0 0 0 2px ${ringColor}, 0 0 16px ${ringColor}55`,
          }}
        />
      )}

      <span
        aria-hidden
        className='absolute inset-0 rounded-full transition-colors'
        style={{
          backgroundColor: status.met ? GREEN : locked ? "#1e1e22" : "#2e2e34",
        }}
      />

      {!status.met && (
        <svg
          aria-hidden
          viewBox={`0 0 ${NODE} ${NODE}`}
          className='absolute inset-0 h-full w-full -rotate-90'>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RING_R}
            fill='none'
            stroke={locked ? "#45454d" : "#52525b"}
            strokeWidth={stroke}
            strokeDasharray={locked ? "3 4" : undefined}
          />
          {!locked && percent > 0 && (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RING_R}
              fill='none'
              stroke={status.color}
              strokeWidth={stroke}
              strokeLinecap='round'
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC - percent * CIRC}
              className='transition-[stroke-dashoffset] duration-700 ease-out'
            />
          )}
        </svg>
      )}

      <span className='relative'>
        {locked ? (
          <Lock className='h-5 w-5 text-zinc-500' />
        ) : status.met ? (
          <Check className='h-6 w-6 text-emerald-950' strokeWidth={3} />
        ) : (
          <Icon
            className='h-5 w-5'
            style={{ color: isCurrent ? status.color : "#8e8e98" }}
          />
        )}
      </span>

      {/* Amber pulse = Fame waiting, emerald tick = already collected. */}
      {claimable && (
        <span
          aria-hidden
          className='absolute -right-0.5 -top-0.5 z-20 h-3.5 w-3.5 animate-pulse rounded-full bg-amber-500 ring-2 ring-zinc-900'
        />
      )}
      {status.claimed && (
        <span
          aria-hidden
          className='absolute -right-0.5 -top-0.5 z-20 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-zinc-900'>
          <Check size={9} strokeWidth={3.5} className='text-zinc-950' />
        </span>
      )}
    </div>
  );
};
