import { cn } from "assets/lib/utils";
import type { CSSProperties, ReactNode } from "react";

/**
 * The hollow every owned thing in the arsenal sits in.
 *
 * One look, defined once: a dark socket with the tier's light pooling around
 * whatever is in it, the dark closing in from the edges, and a hairline of the
 * tier colour drawing the rim. The stash board is built out of these at 80px;
 * a bill row uses the same plate at 44px, which is what makes a part on a
 * receipt read as *the same object* as the pile it came from.
 *
 * The size drives the depth of the hollow, so a small plate is not just a big
 * one scaled down into mush.
 */

/**
 * The purple mods wear everywhere in the arsenal — bench, picker, socket and the
 * trader's counter. A mod has no tier and no rarity, so this stands in for one
 * wherever a mod needs a plate lit like everything else.
 */
export const MOD_ACCENT = "#c084fc";

/** Rasterised once by the browser and cached — the grain the cards use too. */
export const PLATE_NOISE_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E")`;

interface PlateStyleOptions {
  /** The tier or rarity colour this plate is lit by. */
  color: string;
  /** Rendered size in px — drives how deep the hollow is drawn. */
  size: number;
  /** Overrides the rim colour, for a socket that is flagged or targeted. */
  ringColor?: string;
  /** Width of the rim in px. */
  ringWidth?: number;
  /** Outer glow, for a socket calling for attention. */
  glow?: string;
}

/**
 * The inset half of a plate: the hollow, the rim, the lit top edge.
 *
 * Split out because whatever sits in the plate can be as large as the plate
 * itself — a mod's blueprint plate fills its socket edge to edge — and would
 * then paint straight over a hollow drawn underneath it. Such a caller keeps the
 * light on the plate and lays this half back over its contents.
 */
export const plateHollow = ({
  color,
  size,
  ringColor,
  ringWidth = 1,
}: Omit<PlateStyleOptions, "glow">): string =>
  [
    `inset 0 0 ${Math.round(size * 0.28)}px ${Math.round(size * 0.09)}px rgba(0,0,0,0.82)`,
    `inset 0 0 0 ${ringWidth}px ${ringColor ?? `${color}6b`}`,
    "inset 0 1px 0 rgba(255,255,255,0.06)",
  ].join(",");

/** Background and shadow of a plate, for callers that own the rest of the box. */
export const plateStyle = ({
  color,
  size,
  ringColor,
  ringWidth = 1,
  glow,
}: PlateStyleOptions): CSSProperties => ({
  backgroundColor: "#0b0b0e",
  backgroundImage: [
    // The tier's light, centred on the thing itself
    `radial-gradient(66% 52% at 50% 46%, ${color}42 0%, ${color}12 48%, transparent 78%)`,
    // A little of it pooling on the floor of the socket
    `linear-gradient(180deg, transparent 62%, ${color}2b 100%)`,
  ].join(","),
  boxShadow: [
    plateHollow({ color, size, ringColor, ringWidth }),
    glow ?? "0 1px 2px rgba(0,0,0,0.7)",
  ].join(","),
});

interface TierPlateProps {
  color: string;
  size: number;
  /** Drained the way a short bill row is. */
  muted?: boolean;
  /**
   * Stack size, bottom-right — the same dark chip a stash socket wears, in a
   * different shape from a level so `×50` is never read as "level 50".
   */
  count?: number;
  children: ReactNode;
  className?: string;
}

/** The plate as a component, for the places that just need to frame an icon. */
export const TierPlate = ({
  color,
  size,
  muted = false,
  count,
  children,
  className,
}: TierPlateProps) => (
  <span
    aria-hidden
    className={cn(
      "relative flex shrink-0 items-center justify-center overflow-hidden rounded-md",
      muted && "opacity-40 grayscale",
      className,
    )}
    style={{ width: size, height: size, ...plateStyle({ color, size }) }}>
    <span
      className='pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay'
      style={{ backgroundImage: PLATE_NOISE_BG, backgroundSize: "140px 140px" }}
    />
    <span className='relative flex items-center justify-center'>
      {children}
    </span>

    {count != null && count > 0 && (
      <span
        className='absolute bottom-0.5 right-0.5 rounded-[3px] bg-black/80 px-1 py-0.5 text-[10px] font-black tabular-nums leading-none text-zinc-100'
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.9)" }}>
        ×{count}
      </span>
    )}
  </span>
);
