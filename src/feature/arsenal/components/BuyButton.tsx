import { cn } from "assets/lib/utils";
import { ShoppingCart } from "lucide-react";

interface BuyButtonProps {
  /** Fame this press spends. Rides on the button, the way the case shop prices its CTA. */
  price: number;
  canAfford: boolean;
  isBuying: boolean;
  onClick: () => void;
  /**
   * `soft` for a grid of cards, where a solid bar on every one would have them
   * all shouting at once; `solid` for the one loud CTA on a screen.
   */
  variant?: "solid" | "soft";
  /** `sm` for the narrow footer of a trading card. */
  size?: "default" | "sm";
  className?: string;
}

/**
 * The one way Fame leaves the arsenal over a counter — the trader's three cards
 * and the player listings all pay through this.
 *
 * Cut to the same cloth as the case shop's `OpenCaseButton`, so buying a screw, a
 * mod and a case all feel like the same act. It used to be a saturated amber bar
 * with white text on every card, which read as a warning as much as a button and
 * carried the price nowhere on it.
 */
export const BuyButton = ({
  price,
  canAfford,
  isBuying,
  onClick,
  variant = "soft",
  size = "default",
  className,
}: BuyButtonProps) => {
  const solid = variant === "solid";

  return (
    <button
      onClick={onClick}
      disabled={isBuying || !canAfford}
      title={!canAfford ? "Not enough Fame Points" : undefined}
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg font-bold transition-colors duration-150 click-behavior",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-arsenal-accent/60",
        size === "sm" ? "h-9 px-3 text-xs" : "h-10 px-4 text-sm",
        canAfford
          ? solid
            ? "bg-arsenal-accent text-arsenal-bg hover:bg-arsenal-accent/90"
            : "bg-arsenal-accent/15 text-arsenal-accent hover:bg-arsenal-accent/25"
          : "cursor-not-allowed bg-arsenal-card text-arsenal-text-tertiary",
        isBuying && "cursor-wait opacity-70",
        className,
      )}>
      <span className='flex items-center gap-2'>
        <ShoppingCart size={size === "sm" ? 13 : 15} strokeWidth={2.5} />
        {isBuying ? "Buying…" : canAfford ? "Buy" : "Not enough Fame"}
      </span>
      {/* Fame keeps its gold on the soft (card-grid) button — on the solid
          turquoise CTA, amber-on-turquoise is nearly unreadable, so the price
          takes the same dark text as the rest of that button instead. */}
      <span
        className={cn(
          "flex items-center gap-1.5 tabular-nums",
          canAfford
            ? solid
              ? "text-arsenal-bg"
              : "text-amber-400"
            : "text-arsenal-text-tertiary",
        )}>
        <img
          src='/images/coin.png'
          alt=''
          className={cn(
            "h-4 w-4 object-contain",
            !canAfford && "opacity-50 grayscale",
          )}
        />
        {price.toLocaleString()}
      </span>
    </button>
  );
};
