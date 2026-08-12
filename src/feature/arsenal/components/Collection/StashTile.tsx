import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { Star } from "lucide-react";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import { useResponsiveStore } from "store/useResponsiveStore";

import {
  MOD_ACCENT,
  PLATE_NOISE_BG,
  plateHollow,
  plateStyle,
} from "../TierPlate";

/**
 * Sockets are sized by the board, not by us, so the hollow is drawn for a
 * typical one. Close enough at every column count the grid actually produces.
 */
const SOCKET_SIZE = 80;

/** What a socket needs to take part in a drag, from `useStashDrag`. */
export interface StashDragHandlers {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
}

/**
 * Something is being carried that this socket could receive: `candidate` for one
 * of the places it could go, `active` for the one the pointer is over.
 */
export type StashDropTarget = "candidate" | "active";

/** Where a socket sits on the board and how the board is treating it. */
export interface StashPlacement {
  /**
   * Zero-based cell on the board. Both are omitted off the board — a rig picker
   * lays the same sockets out in an ordinary grid and lets it flow them.
   */
  column?: number;
  row?: number;
  dragging?: boolean;
  dimmed?: boolean;
  /**
   * Shown, but not pickable — a rig picker lists a copy already sitting in
   * another slot rather than hiding it, because "it is taken" is an answer and a
   * missing tile is not.
   */
  disabled?: boolean;
  dropTarget?: StashDropTarget;
  dragHandlers?: StashDragHandlers;
}

interface StashTileProps {
  /**
   * Colours the whole socket — the only thing that tells tiers apart at this
   * size. Gear passes its rarity colour, parts their tier colour.
   */
  color: string;
  imageSrc?: string;
  /** Guitar art is shot lying down; a tall socket stands it back up. */
  imageRotated?: boolean;
  /** Artwork that isn't a plain image, e.g. a part glyph. Wins over `imageSrc`. */
  art?: ReactNode;
  /** Takes two rows, the way a two-handed weapon does. Guitars, in practice. */
  tall?: boolean;
  /** Zero-based cell the socket is pinned to. Omitted = let the grid flow it. */
  column?: number;
  row?: number;
  /** Carried by the pointer right now — the socket it left stays as a hole. */
  dragging?: boolean;
  /** Filtered out by the toolbar: still in place, but out of the way. */
  dimmed?: boolean;
  /** Rendered, but nothing happens on click. See `StashPlacement`. */
  disabled?: boolean;
  /** Can receive whatever is being carried right now. See `StashDropTarget`. */
  dropTarget?: StashDropTarget;
  /** Makes the socket draggable. Absent = the piece is fixed in place. */
  dragHandlers?: StashDragHandlers;
  /** Read out to screen readers and shown as the native tooltip. */
  label: string;
  /** Stack size, bottom-right. Only parts stack — gear is one socket per copy. */
  count?: number;
  /** Item level, top-left. */
  level?: number;
  /**
   * Put in front of `level` when the number is not a level — a rescued mod
   * carries a bonus, and `+8` must not be read as "level 8".
   */
  levelPrefix?: string;
  /** Unseen drop: the corner star, same flag the cards use. */
  isNew?: boolean;
  /** In use somewhere (profile, rig, pedalboard) — a lit frame and a corner dot. */
  inUse?: boolean;
  /** Full card shown on hover. Desktop only; touch opens the sheet instead. */
  preview?: ReactNode;
  onClick?: () => void;
}

/**
 * One socket of the stash.
 *
 * A card answers "what is this item"; a socket answers "what do I own" — so it
 * keeps only what survives at 80px: the tier, the silhouette, the level and the
 * two flags worth acting on. The rest waits behind the hover card.
 *
 * The plate is a hollow rather than a card: the tier's light pools around the
 * item and on the floor beneath it, the dark closes in from every edge, and a
 * single hairline in the tier colour draws the rim.
 */
export const StashTile = ({
  color,
  imageSrc,
  imageRotated = false,
  art,
  tall = false,
  column,
  row,
  dragging = false,
  dimmed = false,
  disabled = false,
  dropTarget,
  dragHandlers,
  label,
  count,
  level,
  levelPrefix,
  isNew = false,
  inUse = false,
  preview,
  onClick,
}: StashTileProps) => {
  const isMobile = useResponsiveStore((state) => state.isMobile);

  // Parts have nothing to open, so their sockets stay plain elements — a button
  // that does nothing is a promise the stash cannot keep.
  const Socket = onClick ? "button" : "div";

  const ringColor = dropTarget ? MOD_ACCENT : inUse ? "#fbbf24" : undefined;
  const ringWidth = dropTarget === "active" ? 2 : 1;
  const glow =
    dropTarget === "active"
      ? `0 0 18px ${MOD_ACCENT}a6`
      : dropTarget
        ? `0 0 9px ${MOD_ACCENT}52`
        : inUse
          ? "0 0 10px rgba(251,191,36,0.35)"
          : "0 1px 2px rgba(0,0,0,0.7)";

  const plate: CSSProperties = {
    gridColumn: column != null ? column + 1 : undefined,
    gridRow:
      row != null
        ? `${row + 1} / span ${tall ? 2 : 1}`
        : tall
          ? "span 2"
          : undefined,
    // The pointer drives the drag, so the browser must not claim the gesture
    // for scrolling first.
    touchAction: dragHandlers ? "none" : undefined,
    opacity: dragging ? 0.25 : dimmed ? 0.28 : undefined,
    filter: dimmed && !dragging ? "grayscale(0.7)" : undefined,
    // The hollow itself comes from `TierPlate`, which is also what frames a part
    // on a bill — one look, so a socket and a receipt line read as one object.
    // Everything a socket knows on top of that is the rim and the glow: a
    // waiting drop target takes the mod colour over its own rarity, because
    // while a drag is on, "can this take it" is the only question being asked.
    ...plateStyle({ color, size: SOCKET_SIZE, ringColor, ringWidth, glow }),
    // Art can be as large as the socket — a mod wears its blueprint plate edge to
    // edge — so the hollow and the rim are laid back over the contents below and
    // the plate itself keeps only the tier's light and its outward glow.
    boxShadow: glow,
  };

  const tile = (
    <Socket
      {...(onClick ? { type: "button" as const, onClick, disabled } : {})}
      {...dragHandlers}
      // Art is natively draggable: left alone, the browser starts its own image
      // drag, the pointer stream is cancelled, and the piece never moves.
      draggable={false}
      onDragStart={(event) => event.preventDefault()}
      title={label}
      aria-label={label}
      className={cn(
        "group relative flex h-full w-full select-none items-center justify-center overflow-hidden rounded-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70",
        dragHandlers && "cursor-grab active:cursor-grabbing",
        disabled && "cursor-not-allowed",
      )}
      style={plate}>
      {/* Grain, blended into the plate rather than laid over it as a haze */}
      <span
        aria-hidden
        className='pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay'
        style={{
          backgroundImage: PLATE_NOISE_BG,
          backgroundSize: "140px 140px",
        }}
      />

      {/* The tier's light lifts under the cursor — the socket itself never moves */}
      <span
        aria-hidden
        className='pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100'
        style={{
          background: `radial-gradient(58% 48% at 50% 48%, ${color}3d 0%, transparent 74%)`,
        }}
      />

      {art ? (
        // Stretched rather than shrink-wrapped: art that wants the whole socket
        // takes it, and art with a size of its own still lands in the middle.
        <span className='pointer-events-none absolute inset-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-110'>
          {art}
        </span>
      ) : imageRotated ? (
        // Standing the art up swaps its width and height, so it is placed
        // absolutely and sized off the socket's width — 155% of that is about
        // 78% of a two-row socket's height once turned.
        <img
          src={imageSrc}
          alt=''
          aria-hidden
          loading='lazy'
          decoding='async'
          draggable={false}
          className='pointer-events-none absolute left-1/2 top-1/2 w-[155%] max-w-none'
          style={
            {
              transform: "translate(-50%, -50%) rotate(-90deg)",
              filter: "drop-shadow(0 3px 7px rgba(0,0,0,0.7))",
              WebkitUserDrag: "none",
            } as CSSProperties
          }
        />
      ) : (
        <img
          src={imageSrc}
          alt=''
          aria-hidden
          loading='lazy'
          decoding='async'
          draggable={false}
          className='pointer-events-none relative max-h-[84%] max-w-[84%] object-contain transition-transform duration-200 group-hover:scale-105'
          style={
            {
              filter: "drop-shadow(0 3px 7px rgba(0,0,0,0.7))",
              WebkitUserDrag: "none",
            } as CSSProperties
          }
        />
      )}

      {/* The hollow and the rim, laid back over the art rather than under it —
          full-bleed artwork would otherwise paint straight over the socket. */}
      <span
        aria-hidden
        className='pointer-events-none absolute inset-0 rounded-sm'
        style={{
          boxShadow: plateHollow({
            color,
            size: SOCKET_SIZE,
            ringColor,
            ringWidth,
          }),
        }}
      />

      {/* Hover wash — the only feedback that fits inside a socket */}
      <span
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-white/0 transition-colors group-hover:bg-white/[0.09]'
      />

      {/* Level, as the emblem the cards use, shrunk to corner size: a dark
          capsule ringed in the tier's colour, digits in white. Bare coloured
          text used to sit straight on the artwork, where a light pickup or a
          bright pedal face swallowed it. */}
      {level != null && level > 0 && (
        <span
          className='absolute left-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-black tabular-nums leading-none text-white'
          style={{
            background: "radial-gradient(circle at 50% 35%, #1c1c22, #0b0b0e)",
            boxShadow: `inset 0 0 0 1px ${color}, 0 0 8px ${color}55, 0 1px 3px rgba(0,0,0,0.9)`,
          }}>
          {levelPrefix}
          {level}
        </span>
      )}

      {inUse && (
        <span
          aria-hidden
          className='absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-400'
          style={{ boxShadow: "0 0 6px rgba(251,191,36,0.9)" }}
        />
      )}

      {isNew && (
        <Star
          size={11}
          aria-hidden
          className='absolute bottom-0.5 left-0.5 fill-amber-400 text-amber-400'
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.95))" }}
        />
      )}

      {/* Stack size, in the opposite corner and in a different shape from the
          level — a dark chip, no tier colour, and the × that says out loud this
          is "how many", not "how good". */}
      {count != null && count > 0 && (
        <span
          className='absolute bottom-1 right-1 rounded-[3px] bg-black/80 px-1 py-0.5 text-[10px] font-black tabular-nums leading-none text-zinc-100'
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.9)" }}>
          ×{count}
        </span>
      )}
    </Socket>
  );

  if (!preview || isMobile) return tile;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={120}>
        <TooltipTrigger asChild>{tile}</TooltipTrigger>
        <TooltipContent
          side='right'
          sideOffset={8}
          className='w-[260px] border-0 bg-transparent p-0 shadow-none'>
          {preview}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
