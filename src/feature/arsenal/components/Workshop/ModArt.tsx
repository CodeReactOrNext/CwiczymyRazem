import { cn } from "assets/lib/utils";
import { getModArt } from "feature/arsenal/data/modArt";
import { Wrench } from "lucide-react";

import { plateStyle } from "./blueprintPlate";

interface ModArtProps {
  modId: string;
  /**
   * Rendered box in px — the cut-outs are 600px, so anything up to 300 stays
   * crisp. Omit it to fill the parent instead, e.g. a stash socket, which sizes
   * itself off the board rather than off a number known here.
   */
  size?: number;
  /** A mod the wallet cannot pay for is drained the same way a short part row is. */
  dimmed?: boolean;
  className?: string;
}

/** Squares across the plate — the grid is sized to hold this many either way. */
const GRID_STEPS = 6;

/**
 * A mod's part on a blueprint plate, or the same plate with a neutral glyph for
 * the mods that have not been drawn yet.
 *
 * The art files are cut-outs with no backdrop of their own, so the plate is built
 * here instead of being baked into every picture: the grid is then drawn at the
 * size the tile is actually rendered at — a 44px row and a 96px picker row both
 * get a legible grid rather than a downscaled mush of one — and restyling the
 * whole set is a change to `blueprintPlate`, not to 49 files.
 *
 * Always the same box either way, like `PartIcon`, so a list of mods keeps its
 * rhythm. The part is *contained*, never cropped: cover would eat the ends off a
 * neck shot, and these cut-outs are not all square. Each file is trimmed to its
 * own edges, so the padding here is what every part breathes by — one number
 * instead of whatever margin each drawing happened to be rendered with.
 */
export const ModArt = ({ modId, size, dimmed, className }: ModArtProps) => {
  const src = getModArt(modId);
  const fills = size == null;
  // Fixed boxes get the grid in px, with a floor so small tiles don't turn into
  // moiré; a filling plate has no px to work from and takes the same count in %.
  const cell = fills
    ? `${100 / GRID_STEPS}%`
    : `${Math.max(10, Math.round(size / GRID_STEPS))}px`;

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden",
        // A filling plate is the socket's own face: the frame around it is the
        // socket's, so it brings neither a rim nor a second corner radius.
        fills
          ? "h-full w-full"
          : "rounded-lg ring-1 ring-inset ring-sky-200/10",
        dimmed && "opacity-40 grayscale",
        className,
      )}
      style={{
        ...(fills ? undefined : { width: size, height: size }),
        ...plateStyle(cell),
      }}
      aria-hidden>
      {src ? (
        <img
          src={src}
          alt=''
          loading='lazy'
          decoding='async'
          draggable={false}
          className='h-full w-full object-contain p-[10%]'
        />
      ) : (
        <Wrench
          size={Math.round((size ?? 40) * 0.32)}
          className='text-sky-200/25'
        />
      )}
    </span>
  );
};
