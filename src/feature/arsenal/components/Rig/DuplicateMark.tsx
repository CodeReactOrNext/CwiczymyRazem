import { cn } from "assets/lib/utils";
import { Copy } from "lucide-react";

import type { BoardCopy } from "../../data/boardDuplicates";
import {
  describeDuplicateCopy,
  formatDuplicateShare,
} from "../../data/boardDuplicates";

/**
 * The mark a pedal wears when the same pedal stands on the board more than
 * once — and the glow that ties the set together.
 *
 * The board used to say this with a single grey "½" in the corner of the extra
 * copies, which is the right information in the wrong place: it is small, it
 * sits on top of artwork that is already busy, and it says nothing about *which*
 * pedal it is a second copy of. A player reading three identical enclosures and
 * one tiny glyph has to work the rule out backwards.
 *
 * So the whole group is marked, not only the copies that lose levels:
 *
 *  • The best copy wears the group's **count** (`×3`) at full strength — "you
 *    have three of these, this is the one that counts in full".
 *  • Every copy after it wears **what it is counted at** — `½`, then `0` —
 *    progressively dimmer, because that is what the mark means: this copy is
 *    faded out of the sum. Deliberately no accent colour. Amber is Fame in
 *    this app and reads as a prize, and red is what the board already says to
 *    a pedal that cannot go where it is being dropped; a duplicate is neither
 *    a reward nor an error, just a copy that stopped counting.
 *  • Hovering any copy lights the whole set through `duplicateGlow`, so the
 *    answer to "a duplicate of *what*?" is one pointer move away and needs no
 *    tooltip to read.
 *
 * Only ever rendered for a pedal in a group of more than one: a pedal standing
 * alone wears nothing at all, which is what keeps the mark meaningful.
 */

/** Tone per copy: the keeper reads bright, each discounted copy dimmer. */
const toneOf = (copy: BoardCopy): string => {
  if (copy.index === 0) return "text-zinc-200";
  return copy.share === 0 ? "text-zinc-500" : "text-zinc-400";
};

/**
 * The glow a copy is drawn with, or `null` for none — a CSS `filter` value, so
 * the board can fold it into the filter chain it already builds per pedal.
 *
 * Lit on the copies that are losing levels, and on every copy of a group the
 * pointer is currently on. Light rather than an outline: the board is a photo
 * of gear, and a drawn ring on artwork reads as part of the pedal. Plain cool
 * white, for the same reason the marks carry no accent colour.
 */
export const duplicateGlow = (
  copy: BoardCopy | undefined,
  active: boolean,
): string | null => {
  if (!copy || copy.total < 2) return null;
  if (active) return "drop-shadow(0 0 16px rgba(244,244,245,0.8))";
  return copy.share < 1 ? "drop-shadow(0 0 11px rgba(228,228,231,0.45))" : null;
};

interface DuplicateMarkProps {
  copy: BoardCopy;
  /** The pedal's name, for the tooltip. */
  name: string;
  /** True while the pointer is on any copy of the same pedal. */
  active?: boolean;
}

export const DuplicateMark = ({ copy, name, active }: DuplicateMarkProps) => {
  if (copy.total < 2) return null;

  const isKeeper = copy.index === 0;
  const label = isKeeper
    ? `×${copy.total}`
    : (formatDuplicateShare(copy.share) ?? "1");

  return (
    <span
      title={describeDuplicateCopy(copy, name)}
      aria-label={describeDuplicateCopy(copy, name)}
      className={cn(
        "absolute bottom-1 right-1 z-10 flex items-center gap-1 rounded px-1.5 py-[3px]",
        "text-[11px] font-bold tabular-nums leading-none transition-colors",
        active ? "bg-zinc-950" : "bg-zinc-950/90",
        toneOf(copy),
      )}>
      <Copy
        size={9}
        strokeWidth={3}
        aria-hidden
        className={cn(isKeeper ? "text-zinc-500" : "opacity-80")}
      />
      {label}
    </span>
  );
};
