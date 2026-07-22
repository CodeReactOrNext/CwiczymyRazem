import { Guitar, Headphones, Music } from "lucide-react";
import { useId } from "react";
import { TbGuitarPick } from "react-icons/tb";

interface GuitarPatternBackgroundProps {
  /** Pattern opacity. Keep this low — it's a texture, not a graphic. */
  opacity?: number;
  /** Multiplier applied to the base 160px tile size. */
  scale?: number;
  /**
   * `dark` (default) draws white icons for use on near-black surfaces.
   * `light` draws ink-colored icons for the ivory section.
   */
  variant?: "dark" | "light";
  className?: string;
}

/**
 * Tiled guitar/music icon watermark, extracted from the pattern used on
 * `/login`. Reused at most twice on the landing page (see PR writeup) so it
 * stays a texture rather than becoming visual noise.
 */
export const GuitarPatternBackground = ({
  opacity = 0.03,
  scale = 1,
  variant = "dark",
  className,
}: GuitarPatternBackgroundProps) => {
  const patternId = useId();
  const tile = 160 * scale;
  const iconColorClass = variant === "light" ? "text-ivory-fg" : "text-white";

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
          <g
            transform={`translate(${20 * scale}, ${20 * scale}) scale(${scale})`}>
            <Guitar size={32} className={iconColorClass} strokeWidth={1.5} />
          </g>
          <g
            transform={`translate(${100 * scale}, ${40 * scale}) scale(${scale})`}>
            <Music size={28} className={iconColorClass} strokeWidth={1.5} />
          </g>
          <g
            transform={`translate(${40 * scale}, ${100 * scale}) scale(${scale})`}>
            <TbGuitarPick
              size={30}
              className={iconColorClass}
              strokeWidth={1.5}
            />
          </g>
          <g
            transform={`translate(${110 * scale}, ${110 * scale}) scale(${scale})`}>
            <Headphones
              size={32}
              className={iconColorClass}
              strokeWidth={1.5}
            />
          </g>
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
