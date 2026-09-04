import { cn } from "assets/lib/utils";
import { Ticket } from "lucide-react";

interface FreeCaseButtonProps {
  isOpening: boolean;
  onClick: () => void;
  /** How many are left, so the stock visibly drains as they are spent. */
  tokens: number;
  className?: string;
}

/**
 * Spends a free case earned from an achievement.
 *
 * Sits under the Fame button rather than replacing it, because which of the two
 * to pay with is a real decision: a token is worth whatever case it is spent on,
 * so it is usually worth holding until an Elite one is what the player wants.
 * Auto-spending them on whatever card was clicked first would have taken that
 * decision away.
 */
export const FreeCaseButton = ({
  isOpening,
  onClick,
  tokens,
  className,
}: FreeCaseButtonProps) => (
  <button
    onClick={onClick}
    disabled={isOpening}
    className={cn(
      "flex items-center justify-between gap-2 rounded-lg bg-cyan-500/10 px-4 py-2.5 text-xs font-bold capitalize tracking-wide text-cyan-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-cyan-500/20",
      isOpening && "cursor-wait opacity-70",
      className,
    )}>
    <span className='flex items-center gap-2'>
      <Ticket size={14} strokeWidth={2.5} />
      Open free
    </span>
    <span className='text-sm tabular-nums text-cyan-200'>{tokens}</span>
  </button>
);
