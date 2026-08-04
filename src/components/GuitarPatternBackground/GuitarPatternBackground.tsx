import { Guitar, Headphones, type LucideIcon, Music } from "lucide-react";
import { useId } from "react";
import { TbGuitarPick } from "react-icons/tb";

// Fixed offsets for the 4 icon slots inside one tile — scattered, not grid-aligned,
// so neighbouring tiles read as an overlapping cluster rather than a repeating stamp.
const SLOTS = [
  { x: 20, y: 20 },
  { x: 100, y: 40 },
  { x: 40, y: 100 },
  { x: 110, y: 110 },
] as const;

const DEFAULT_ICONS: LucideIcon[] = [Guitar, Music, TbGuitarPick as unknown as LucideIcon, Headphones];

interface GuitarPatternBackgroundProps {
  /** Pattern opacity. Keep this low — it's a texture, not a graphic. */
  opacity?: number;
  /** Multiplier applied to the base 160px tile size. */
  scale?: number;
  /**
   * `dark` (default) draws white icons for use on near-black surfaces.
   * `light` draws ink-colored icons for the ivory section.
   * Ignored when `color` is set.
   */
  variant?: "dark" | "light";
  /** Raw color (hex/rgb) for the icons — overrides `variant`, for tinting to a specific surface. */
  color?: string;
  /** Up to 4 icons filling the tile's 4 slots. Defaults to the guitar/music set used on /login. */
  icons?: LucideIcon[];
  className?: string;
}

/**
 * Tiled icon watermark, extracted from the pattern used on `/login`. Reused
 * at most twice on the landing page (see PR writeup) so it stays a texture
 * rather than becoming visual noise. `icons`/`color` let other surfaces reuse
 * the same layering technique with a set that matches their own subject.
 */
export const GuitarPatternBackground = ({
  opacity = 0.03,
  scale = 1,
  variant = "dark",
  color,
  icons = DEFAULT_ICONS,
  className,
}: GuitarPatternBackgroundProps) => {
  const patternId = useId();
  const tile = 160 * scale;
  const iconColorClass = variant === "light" ? "text-ivory-fg" : "text-white";
  const tileIcons = SLOTS.map((slot, i) => ({ slot, Icon: icons[i % icons.length] }));

  return (
    <svg
      className={
        className ?? "pointer-events-none absolute inset-0 h-full w-full"
      }
      style={{ opacity }}
      aria-hidden='true'>
      <defs>
        <pattern
          id={patternId}
          x='0'
          y='0'
          width={tile}
          height={tile}
          patternUnits='userSpaceOnUse'
          patternTransform='rotate(-15)'>
          {tileIcons.map(({ slot, Icon }, i) => (
            <g key={i} transform={`translate(${slot.x * scale}, ${slot.y * scale}) scale(${scale})`}>
              <Icon
                size={30}
                strokeWidth={1.5}
                className={color ? undefined : iconColorClass}
                color={color}
              />
            </g>
          ))}
        </pattern>
      </defs>
      <rect
        x='0'
        y='0'
        width='100%'
        height='100%'
        fill={`url(#${patternId})`}
      />
    </svg>
  );
};
