import { cn } from "assets/lib/utils";

interface OpenCaseButtonProps {
  canAfford: boolean;
  isOpening: boolean;
  onClick: () => void;
  /** When set, the price rides inside the button instead of sitting on its own row. */
  fameCost?: number;
  /**
   * `featured` is the one loud CTA on the screen — amber, with the price
   * folded into the label. `solid` is the white flavour of the same thing.
   * Shop cards use `soft` so six bars don't compete with the featured one —
   * and with each other — at once.
   */
  variant?: "featured" | "solid" | "soft";
  className?: string;
}

export const OpenCaseButton = ({
  canAfford,
  isOpening,
  onClick,
  fameCost,
  variant = "solid",
  className,
}: OpenCaseButtonProps) => {
  const isFeatured = variant === "featured";
  const isSolid = variant === "solid";
  const label = isOpening ? "Opening..." : "Open case";

  if (isFeatured) {
    return (
      <button
        onClick={onClick}
        disabled={!canAfford || isOpening}
        className={cn(
          "flex items-center justify-center gap-2.5 rounded-lg px-5 py-3 text-sm font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-300/60",
          canAfford
            ? "bg-amber-400 text-zinc-950 hover:bg-amber-300"
            : "cursor-not-allowed bg-arsenal-card text-arsenal-text-tertiary",
          isOpening && "cursor-wait opacity-70",
          className,
        )}>
        <img
          src='/images/coin.png'
          alt=''
          className={cn(
            "h-5 w-5 object-contain",
            !canAfford && "opacity-50 grayscale",
          )}
        />
        <span>{label}</span>
        {fameCost !== undefined && (
          <span className='tabular-nums'>· {fameCost}</span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={!canAfford || isOpening}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold capitalize tracking-wide transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-arsenal-accent/60",
        fameCost !== undefined && "justify-between",
        isSolid
          ? canAfford
            ? "bg-arsenal-accent text-arsenal-bg hover:bg-arsenal-accent/90"
            : "cursor-not-allowed bg-arsenal-card text-arsenal-text-tertiary"
          : canAfford
            ? "bg-arsenal-accent/15 text-arsenal-accent hover:bg-arsenal-accent/25"
            : "cursor-not-allowed bg-arsenal-bg text-arsenal-text-tertiary",
        isOpening && "cursor-wait opacity-70",
        className,
      )}>
      <span>{label}</span>
      {fameCost !== undefined && (
        // Fame keeps its gold even on the button — on the solid white CTA the
        // price takes the button's own dark text instead; the soft variant
        // keeps the coin's gold.
        <span
          className={cn(
            "flex items-center gap-1.5 text-sm tabular-nums",
            isSolid ? "text-arsenal-bg" : "text-amber-400",
            !canAfford && "text-red-400",
          )}>
          <img
            src='/images/coin.png'
            alt=''
            className={cn(
              "h-5 w-5 object-contain",
              !canAfford && "opacity-50 grayscale",
            )}
          />
          {fameCost}
        </span>
      )}
    </button>
  );
};
