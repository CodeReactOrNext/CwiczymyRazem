import { cn } from "assets/lib/utils";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { Check, ChevronUp, Lock } from "lucide-react";

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
  /** The most one person may put on one item. Absent where there is no cap. */
  max?: number;
  /** What the reader has left to spend anywhere. */
  tokensLeft: number;
  busy: boolean;
  /** What is being backed, for the label: "idea", "piece of gear". */
  what: string;
  /** The thing's own name, on a board where the row carries one — a ballot of
   *  two dozen guitars gives every pill the same label without it. */
  name?: string;
  /** Accent hex for a board that colours by rarity. Cyan when absent. */
  accent?: string;
  /** The vote is over — shipped or turned down. The count stays, as a result. */
  closed?: boolean;
  /** What one push costs, shown on a wide button. */
  cost?: number;
  /** Laid out as a bar across the foot of a card instead of a column beside it. */
  wide?: boolean;
  onBack: () => void;
}

export const VotePill = ({
  total,
  mine,
  max,
  tokensLeft,
  busy,
  what,
  name,
  accent,
  closed = false,
  cost,
  wide = false,
  onBack,
}: VotePillProps) => {
  const backed = mine > 0;
  const maxed = max !== undefined && mine >= max;
  const broke = tokensLeft <= 0;
  const blocked = closed || busy || maxed || broke;

  const target = name ?? `this ${what}`;
  const label = closed
    ? backed
      ? `Voting is closed — you put ${mine} in`
      : "Voting is closed"
    : maxed
      ? `You have put ${mine} in — the most one person can`
      : broke
        ? "Nothing left in your wallet to spend"
        : backed
          ? `Spend another token on ${target} — you have put ${mine} in`
          : `Spend a token on ${target}`;

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
        "group flex select-none rounded-lg transition-background",
        wide
          ? "min-w-0 flex-1 items-center justify-between gap-3 py-2 pl-4 pr-2"
          : "min-h-20 w-16 shrink-0 flex-col items-center justify-center gap-1.5 self-start py-3",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        backed
          ? "bg-cyan-500/10 text-cyan-300"
          : "bg-zinc-800/40 text-zinc-400",
        closed
          ? "cursor-default"
          : blocked
            ? "cursor-not-allowed"
            : cn(
                "active:click-behavior",
                backed
                  ? "hover:bg-cyan-500/20"
                  : "hover:bg-zinc-800/80 hover:text-zinc-100",
              ),
        // Only an empty wallet is dimmed; being all-in is not a fault.
        broke && !backed && !closed && "opacity-40",
      )}
      style={
        backed && accent
          ? { color: accent, backgroundColor: `${accent}1a` }
          : undefined
      }>
      {wide ? (
        <>
          {/* The score, big enough to be read before the title beside it. */}
          <span className='flex items-baseline gap-1.5'>
            <span className='text-2xl font-bold tabular-nums leading-none text-white'>
              {total}
            </span>
            <span className='text-xs text-zinc-500'>
              {total === 1 ? "token" : "tokens"}
            </span>
            {backed && (
              <span className='ml-1 text-xs font-semibold'>you {mine}</span>
            )}
          </span>

          {/* The action, drawn as a button inside the bar — what it does and
              what it costs, in one place. */}
          {closed ? (
            <span className='flex items-center gap-1.5 px-2 text-xs font-medium text-zinc-500'>
              <Lock size={13} />
              Closed
            </span>
          ) : maxed ? (
            <span className='flex items-center gap-1.5 px-2 text-xs font-medium'>
              <Check size={14} />
              Maxed
            </span>
          ) : (
            <span className='flex items-center gap-1.5 rounded bg-zinc-100 px-2.5 py-1.5 text-sm font-semibold text-zinc-900 transition-colors group-hover:bg-white'>
              <ChevronUp size={15} strokeWidth={2.5} />
              Back
              {cost !== undefined && (
                <span className='ml-0.5 flex items-center gap-1 tabular-nums'>
                  <SupportToken size={14} />
                  {cost}
                </span>
              )}
            </span>
          )}
        </>
      ) : closed ? (
        <Lock size={13} className='opacity-60' />
      ) : maxed ? (
        <Check size={15} />
      ) : (
        <ChevronUp size={18} />
      )}

      {!wide && (
        <span className='flex items-center gap-1 text-lg font-bold tabular-nums leading-none'>
          <SupportToken size={15} />
          {total}
        </span>
      )}

      {!wide && backed && (
        <span className='text-[11px] font-semibold leading-none opacity-75'>
          you {mine}
        </span>
      )}
    </button>
  );
};
