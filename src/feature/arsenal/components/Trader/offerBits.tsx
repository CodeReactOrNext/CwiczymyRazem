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
