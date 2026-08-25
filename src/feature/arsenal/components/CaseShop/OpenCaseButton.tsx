import { cn } from "assets/lib/utils";
import { PackageOpen } from "lucide-react";

interface OpenCaseButtonProps {
  canAfford: boolean;
  isOpening: boolean;
  onClick: () => void;
  /** When set, the price rides inside the button instead of sitting on its own row. */
  fameCost?: number;
  /**
   * `solid` is the one loud CTA on the screen (Featured). Shop cards use `soft`
   * so five white bars don't compete with it — and with each other — at once.
   */
  variant?: "solid" | "soft";
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
  const isSolid = variant === "solid";
  return (
    <button
      onClick={onClick}
      disabled={!canAfford || isOpening}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold capitalize tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        fameCost !== undefined && "justify-between",
        isSolid
          ? canAfford
            ? "bg-zinc-100 text-zinc-900 hover:bg-white"
            : "cursor-not-allowed bg-zinc-800/60 text-zinc-500"
          : canAfford
            ? "bg-zinc-100/10 text-zinc-100 hover:bg-zinc-100/20"
            : "cursor-not-allowed bg-zinc-950/40 text-zinc-500",
        isOpening && "cursor-wait opacity-70",
        className,
      )}>
      <span className='flex items-center gap-2'>
        <PackageOpen size={14} strokeWidth={2.5} />
        {isOpening ? "Opening..." : "Open Case"}
      </span>
      {fameCost !== undefined && (
        // Fame keeps its amber on the dark button — the coin art alone is a dark
        // bronze and reads as a smudge against a near-black surface.
        <span
          className={cn(
            "flex items-center gap-1.5 text-sm tabular-nums",
            isSolid ? "text-zinc-900" : "text-amber-400",
            !canAfford && "text-red-400",
          )}>
          <img
            src='/images/coin.png'
            alt=''
            className={cn("h-5 w-5 object-contain", !canAfford && "opacity-50 grayscale")}
          />
          {fameCost}
        </span>
      )}
    </button>
  );
};
