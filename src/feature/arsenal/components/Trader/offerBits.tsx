import { cn } from "assets/lib/utils";

interface OfferPriceProps {
  unitPrice: number;
  /** The price before today's cut — struck through beside the live one. */
  basePrice?: number;
  /** "each" on a part sold by the piece; nothing on a one-off. */
  suffix?: string;
  className?: string;
}

/**
 * The price line every counter card shares: coin, amber figure, the old price
 * struck through when there is a discount, and what the figure is per.
 */
export const OfferPrice = ({
  unitPrice,
  basePrice,
  suffix,
  className,
}: OfferPriceProps) => (
  <span className={cn("flex items-baseline gap-2", className)}>
    <span className='flex items-center gap-1.5 text-lg font-black tabular-nums text-amber-400'>
      <img
        src='/images/coin.png'
        alt=''
        aria-hidden
        className='h-[18px] w-[18px] object-contain'
      />
      {unitPrice.toLocaleString()}
    </span>
    {basePrice != null && basePrice > unitPrice && (
      <span className='text-sm tabular-nums text-zinc-500 line-through'>
        {basePrice.toLocaleString()}
      </span>
    )}
    {suffix && <span className='text-xs text-zinc-400'>{suffix}</span>}
  </span>
);

/** The slot is empty until the restock — said once, the same way, on every card. */
export const TakenToday = () => (
  <p className='flex h-10 items-center justify-center rounded-lg bg-zinc-900/40 text-sm font-semibold text-zinc-500'>
    Taken for today
  </p>
);

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

interface StockMeterProps {
  remaining: number;
  stock: number;
  color: string;
}

/**
 * What is left in the slot, as a bar and a count.
 *
 * "6 / 6 left" as bare text read as a spec; a bar draining as the player buys
 * is what a counter's stock actually does. Lit in the part's own tier colour,
 * so the meter and the plate say the same thing.
 */
export const StockMeter = ({ remaining, stock, color }: StockMeterProps) => (
  <span className='flex flex-col gap-1.5'>
    <Meter share={stock === 0 ? 0 : remaining / stock} color={color} />
    <span className='text-[11px] tabular-nums text-zinc-500'>
      {remaining === 0
        ? "Taken for today"
        : stock === 1
          ? "1 left"
          : `${remaining} of ${stock} left`}
    </span>
  </span>
);

interface RollMeterProps {
  points: number;
  minPoints: number;
  maxPoints: number;
  color: string;
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
}: RollMeterProps) => {
  const span = Math.max(1, maxPoints - minPoints);
  return (
    <span className='flex flex-col gap-1.5'>
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
