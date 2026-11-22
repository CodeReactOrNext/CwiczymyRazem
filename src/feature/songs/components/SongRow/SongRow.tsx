/* eslint-disable @next/next/no-img-element */
import { cn } from "assets/lib/utils";
import { cva } from "class-variance-authority";
import { SONG_COVER_STYLE } from "feature/songs/utils/songCoverLayout";
import { m } from "framer-motion";
import { transitions } from "lib/motion/motion";
import { type LucideIcon, Music } from "lucide-react";
import Link from "next/link";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

/**
 * One look for a song in a list: cover on the left, title over artist, slots
 * for a rank in front and actions behind. Lists whose rows are too custom for
 * `SongRow` (sortable stations, rows with a full-size overlay button) still use
 * `SongThumb` and the text classes below, so a song reads the same everywhere.
 */

export type SongRowSize = "sm" | "md";

/** Title of a song in a regular row (library, board, explore). */
export const SONG_TITLE_CLASS = "truncate text-[15px] font-bold text-zinc-50";
/** Artist under it. */
export const SONG_ARTIST_CLASS = "truncate text-sm text-zinc-400";
/** Dense rows — pickers, ballots, playlist tracks — next to a `sm` cover. */
export const SONG_TITLE_SM_CLASS = "truncate text-sm font-semibold text-zinc-50";
export const SONG_ARTIST_SM_CLASS = "truncate text-xs text-zinc-400";

export const songTitleClass = (size: SongRowSize = "md") =>
  size === "sm" ? SONG_TITLE_SM_CLASS : SONG_TITLE_CLASS;
export const songArtistClass = (size: SongRowSize = "md") =>
  size === "sm" ? SONG_ARTIST_SM_CLASS : SONG_ARTIST_CLASS;

const songThumbVariants = cva(
  "relative flex shrink-0 items-center justify-center overflow-hidden",
  {
    variants: {
      size: {
        sm: "h-10 w-10 rounded",
        md: "h-12 w-12 rounded-lg md:h-14 md:w-14",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/**
 * framer-motion only corrects a radius it can read from `style`, so a cover
 * that morphs (see songCoverLayout) carries its radius there — the same value
 * as the class it replaces.
 */
const MORPH_RADIUS: Record<SongRowSize, CSSProperties> = {
  sm: { borderRadius: 4 },
  md: SONG_COVER_STYLE,
};

interface SongThumbProps {
  coverUrl?: string | null;
  /** Empty by default: the title sits right next to the cover. */
  alt?: string;
  size?: SongRowSize;
  /** Shared-element id, for a cover that morphs into the song's detail view. */
  layoutId?: string;
  layoutDependency?: unknown;
  /** Shown when there is no cover. */
  fallbackIcon?: LucideIcon;
  className?: string;
  /** Overlays pinned to the cover (tier, status, a play hint on hover). */
  children?: ReactNode;
}

/** A song's cover. A span, so it can sit inside a button or a link. */
export const SongThumb = ({
  coverUrl,
  alt = "",
  size = "md",
  layoutId,
  layoutDependency,
  fallbackIcon: FallbackIcon = Music,
  className,
  children,
}: SongThumbProps) => {
  const classes = cn(
    songThumbVariants({ size }),
    !coverUrl && "bg-zinc-800 text-zinc-500",
    className,
  );
  const content = (
    <>
      {coverUrl ? (
        <img src={coverUrl} alt={alt} className='h-full w-full object-cover' />
      ) : (
        <FallbackIcon
          aria-hidden
          className={size === "sm" ? "h-4 w-4" : "h-5 w-5"}
        />
      )}
      {children}
    </>
  );

  if (layoutId) {
    return (
      <m.span
        layoutId={layoutId}
        layoutDependency={layoutDependency}
        transition={transitions.move}
        style={MORPH_RADIUS[size]}
        className={classes}>
        {content}
      </m.span>
    );
  }

  return <span className={classes}>{content}</span>;
};

interface SongRowProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "children"> {
  title: ReactNode;
  artist?: ReactNode;
  coverUrl?: string | null;
  size?: SongRowSize;
  /** Replaces the default cover — e.g. a `SongThumb` with overlays or a morph. */
  cover?: ReactNode;
  /** In front of the cover: a rank key, a number, a drag handle. */
  leading?: ReactNode;
  /** Under the artist: chips, part marks, a stats line. */
  meta?: ReactNode;
  /** Behind the text: tier, actions. Stop propagation in it where needed. */
  trailing?: ReactNode;
  /** Makes the whole row a link instead of a click target. */
  href?: string;
  "data-testid"?: string;
}

const ROW_CLASS =
  "group relative flex items-center gap-3 rounded-lg bg-zinc-800/40 p-3 transition-background hover:bg-zinc-800/60 md:gap-4 md:px-4";

export const SongRow = ({
  title,
  artist,
  coverUrl,
  size = "md",
  cover,
  leading,
  meta,
  trailing,
  href,
  className,
  onClick,
  "data-testid": testId,
  ...rest
}: SongRowProps) => {
  const body = (
    <>
      {leading}
      {cover ?? <SongThumb coverUrl={coverUrl} size={size} />}
      <div className='min-w-0 flex-1'>
        <p translate='no' className={songTitleClass(size)}>
          {title}
        </p>
        {artist && (
          <p translate='no' className={songArtistClass(size)}>
            {artist}
          </p>
        )}
        {meta}
      </div>
      {trailing}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(ROW_CLASS, className)}
        data-testid={testId}>
        {body}
      </Link>
    );
  }

  return (
    <div
      {...rest}
      data-testid={testId}
      onClick={onClick}
      className={cn(ROW_CLASS, onClick && "cursor-pointer", className)}>
      {body}
    </div>
  );
};
