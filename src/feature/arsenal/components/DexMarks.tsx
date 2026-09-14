import { cn } from "assets/lib/utils";
import type { DexStatus } from "feature/arsenal/utils/dex";
import { Archive, CheckCircle2, Tag } from "lucide-react";
import type { CSSProperties } from "react";

/**
 * Where a piece of gear stands with the player, wherever gear is shown that is
 * not (yet) theirs: a case's pool, a market listing, the trader's window, the
 * guild's shelf.
 *
 * Three answers, always the same three: Owned (cyan) says a copy is in the
 * stash right now, Dex (zinc) says the model is on the record, New (amber) says
 * neither — this one would be a first. Owned implies Dex, so an owned piece
 * wears both and a discovered-but-scrapped one wears Dex alone.
 *
 * A new model used to say so by staying blank, which reads exactly like a
 * surface that never asked the question. Every surface that knows the answer
 * now gives it out loud, in the same words, so "have I got this already" is
 * read the same way on the shelf as in the shop.
 */
export const DexMarks = ({
  status,
  className,
}: {
  status: DexStatus;
  className?: string;
}) => (
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
    {!status.isOwned && !status.inDex && (
      <span className='flex items-center gap-1 font-semibold text-amber-400'>
        <Tag size={10} strokeWidth={2.5} className='shrink-0' />
        New for your collection
      </span>
    )}
  </div>
);

/**
 * The same fact as one glyph, for a corner that has no room for words. Owned
 * wins over Dex — a tile carries one icon, and "you have it" is the one that
 * changes what the player does next. A model they have never had wears the
 * amber tag the cards spell out.
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
  return (
    <Tag
      size={size - 2}
      strokeWidth={2.5}
      aria-label='New for your collection'
      className={cn("text-amber-400", className)}
      style={style}
    />
  );
};
