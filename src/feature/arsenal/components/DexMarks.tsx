import { cn } from "assets/lib/utils";
import type { DexStatus } from "feature/arsenal/utils/dex";
import { Archive, CheckCircle2 } from "lucide-react";
import type { CSSProperties } from "react";

/**
 * Where a piece of gear stands with the player, wherever gear is shown that is
 * not (yet) theirs: a case's pool, a market listing, the guild's shelf.
 *
 * Two marks, always the same two: Owned (cyan) says a copy is in the stash
 * right now, Dex (zinc) says the model is on the record. Owned implies Dex, so
 * an owned piece wears both and a discovered-but-gone one wears Dex alone.
 * Nothing at all is the third answer — a new model says so by staying blank.
 */
export const DexMarks = ({
  status,
  className,
}: {
  status: DexStatus;
  className?: string;
}) => {
  if (!status.isOwned && !status.inDex) return null;

  return (
    <div className={cn("flex items-center gap-2 text-[10px]", className)}>
      {status.isOwned && (
        <span className='flex items-center gap-1 text-cyan-400'>
          <CheckCircle2 size={10} />
          Owned
        </span>
      )}
      {status.inDex && (
        <span className='flex items-center gap-1 text-zinc-400'>
          <Archive size={10} />
          Dex
        </span>
      )}
    </div>
  );
};

/**
 * The same fact as one glyph, for a corner that has no room for words. Owned
 * wins over Dex — a tile carries one icon, and "you have it" is the one that
 * changes what the player does next.
 */
export const DexCornerMark = ({
  status,
  size = 14,
  className,
  style,
}: {
  status: DexStatus;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) => {
  if (status.isOwned)
    return (
      <CheckCircle2
        size={size}
        aria-label='Owned'
        className={cn("text-cyan-400", className)}
        style={style}
      />
    );
  if (status.inDex)
    return (
      <Archive
        size={size - 1}
        aria-label='In Dex'
        className={cn("text-zinc-400", className)}
        style={style}
      />
    );
  return null;
};
