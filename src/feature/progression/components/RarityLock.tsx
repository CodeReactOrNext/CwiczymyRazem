import { cn } from "assets/lib/utils";
import type { GuitarRarity } from "feature/arsenal/types/arsenal.types";
import { Lock } from "lucide-react";

import { unlocksAtLevelLabel } from "../data/levelLock";

/**
 * How a locked piece of gear is drawn, everywhere it is drawn.
 *
 * Not a badge stuck on the corner. The Arsenal already has a word for a thing
 * that is present but not running — an unpowered pedal on the board is greyed
 * and dimmed, and the comment there is careful to say it is not dimmed to mean
 * "you cannot have this", it is dimmed because there is no current in it. A
 * guitar waiting on a level is in exactly that state: owned, real, sitting in
 * the stash, just not switched on yet. So it gets the same filter rather than a
 * second visual language for nearly the same idea.
 */
export const UNPOWERED_FILTER = "grayscale(0.7) brightness(0.55)";

/** The item's own art filter with the unpowered treatment folded in. */
export const lockedArtFilter = (base: string, locked: boolean): string =>
  locked ? `${base} ${UNPOWERED_FILTER}` : base;

/**
 * The one phrase the card, the picker and the right-click menu all use — the
 * game's, not the Arsenal's, so the Milestones ladder says it the same way.
 *
 * Never "Level 15" on its own: an item card already shows a level — the item's
 * own, in the emblem — and two bare numbers meaning different things on one
 * card is how a player learns to distrust both.
 */
export const rarityLockLabel = unlocksAtLevelLabel;

/** The long form, for tooltips and anywhere there is room to say why. */
export const rarityLockReason = (rarity: GuitarRarity, lvl: number): string =>
  `${rarity} gear goes in your rig at level ${lvl}. Until then it is yours to keep, sell and work on — just not to play.`;

interface RarityLockNoteProps {
  rarity: GuitarRarity;
  /** The level this rarity opens at. */
  lvl: number;
  /** The tier's colour — the note is lit by the item, not by a new accent. */
  color: string;
  /** Nudges the note off the bottom edge where a card already has something. */
  className?: string;
}

/**
 * The line that sits under a locked item's artwork on its card.
 *
 * In the tier's own colour rather than a level-cyan, because a second accent on
 * a card whose whole identity is one colour reads as a sticker somebody else
 * put there. The lock is the item's, so it is lit the item's way.
 */
export const RarityLockNote = ({
  rarity,
  lvl,
  color,
  className,
}: RarityLockNoteProps) => (
  <div
    className={cn(
      "absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap",
      className,
    )}
    title={rarityLockReason(rarity, lvl)}>
    {/* The note lies straight on the artwork rather than on a plate — a chip
        here would be the fourth boxed thing on the card. A shadow buys the
        contrast a box would have, over a pale guitar body as well as a dark
        one, and costs the card nothing. */}
    <Lock
      size={13}
      aria-hidden
      style={{ color, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.95))" }}
    />
    <span
      className='text-[12px] font-bold tracking-wide'
      style={{ color, textShadow: "0 1px 3px rgba(0,0,0,0.95)" }}>
      {rarityLockLabel(lvl)}
    </span>
  </div>
);
