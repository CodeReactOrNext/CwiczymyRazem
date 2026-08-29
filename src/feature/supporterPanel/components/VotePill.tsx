import { cn } from "assets/lib/utils";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { Check, ChevronUp } from "lucide-react";

/**
 * The one control that spends a token: push an idea, or a piece of gear, up.
 *
 * It is a single button rather than a small arrow sitting above a number,
 * because the number *is* the thing being pushed — separating them left a 28px
 * target that read as decoration next to the count it belonged to. The whole
 * column is the target now, and it carries its own surface so it looks like
 * something to press before anybody hovers it.
 *
 * There is no way down. A token spent here is gone, so a control that offered
 * to take it back would be lying about the currency.
 *
 * Blocked states say which blockage they are, in a tooltip, rather than fading
 * out and leaving the reader to guess: an empty wallet is dimmed, but somebody
 * who has already given all one person may give is not a broken button — they
 * are a finished one, and it says so with a tick.
 */

interface VotePillProps {
  /** Tokens on this item, from everybody. */
  total: number;
  /** What the reader has put in. */
  mine: number;
  /** The most one person may put on one item. */
  max: number;
  /** What the reader has left to spend anywhere. */
  tokensLeft: number;
  busy: boolean;
  /** What is being backed, for the label: "idea", "piece of gear". */
  what: string;
  /** Accent hex for a board that colours by rarity. Cyan when absent. */
  accent?: string;
  onBack: () => void;
}

export const VotePill = ({
  total,
  mine,
  max,
  tokensLeft,
  busy,
  what,
  accent,
  onBack,
}: VotePillProps) => {
  const backed = mine > 0;
  const maxed = mine >= max;
  const broke = tokensLeft <= 0;
  const blocked = busy || maxed || broke;

  const label = maxed
    ? `You have put ${mine} in — the most one person can`
    : broke
      ? "Nothing left in your wallet to spend"
      : backed
        ? `Spend another token on this ${what} — you have put ${mine} in`
        : `Spend a token on this ${what}`;

  return (
    <button
      type='button'
      title={label}
      aria-label={label}
      // Marked rather than disabled: a disabled button swallows the hover, and
      // the tooltip is the only thing here that says why it will not move.
      aria-disabled={blocked}
      onClick={() => {
        if (!blocked) onBack();
      }}
      className={cn(
        "flex w-16 shrink-0 select-none flex-col items-center justify-center gap-1.5",
        "min-h-20 self-start rounded-lg py-3 transition-background",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        backed
          ? "bg-cyan-500/10 text-cyan-300"
          : "bg-zinc-800/40 text-zinc-400",
        blocked
          ? "cursor-not-allowed"
          : cn(
              "active:click-behavior",
              backed
                ? "hover:bg-cyan-500/20"
                : "hover:bg-zinc-800/80 hover:text-zinc-100",
            ),
        // Only an empty wallet is dimmed; being all-in is not a fault.
        broke && !backed && "opacity-40",
      )}
      style={
        backed && accent
          ? { color: accent, backgroundColor: `${accent}1a` }
          : undefined
      }>
      {maxed ? <Check size={15} /> : <ChevronUp size={18} />}

      <span className='flex items-center gap-1 text-lg font-bold tabular-nums leading-none'>
        <SupportToken size={15} />
        {total}
      </span>

      {backed && (
        <span className='text-[11px] font-semibold leading-none opacity-75'>
          you {mine}
        </span>
      )}
    </button>
  );
};
