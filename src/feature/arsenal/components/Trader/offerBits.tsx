import { cn } from "assets/lib/utils";

interface MeterProps {
  /** 0–1 of the bar that is lit. */
  share: number;
  color?: string;
  className?: string;
}

/** A thin bar of the accent colour on a dark track. */
const Meter = ({ share, color = "#e4e4e7", className }: MeterProps) => (
  <span
    className={cn(
      "block h-1 w-full overflow-hidden rounded-full bg-zinc-900/80",
      className,
    )}>
    <span
      className='block h-full rounded-full transition-all duration-300'
      style={{
        width: `${Math.max(0, Math.min(1, share)) * 100}%`,
        backgroundColor: color,
      }}
    />
  </span>
);

interface RollMeterProps {
  points: number;
  minPoints: number;
  maxPoints: number;
  color: string;
  className?: string;
}

/**
 * How good the day's roll is, against the range it could have been.
 *
 * A `+3` means nothing without knowing whether 4 or 8 was the best it could be,
 * so the figure sits on a bar of its own range, filled to where it landed.
 */
export const RollMeter = ({
  points,
  minPoints,
  maxPoints,
  color,
  className,
}: RollMeterProps) => {
  const span = Math.max(1, maxPoints - minPoints);
  return (
    <span className={cn("flex flex-col gap-1.5", className)}>
      <span className='flex items-baseline gap-1.5'>
        <span
          className='text-2xl font-black tabular-nums leading-none'
          style={{ color }}>
          +{points}
        </span>
        <span className='text-xs tabular-nums text-zinc-400'>
          of +{maxPoints} max
        </span>
      </span>
      <Meter share={(points - minPoints) / span} color={color} />
    </span>
  );
};
