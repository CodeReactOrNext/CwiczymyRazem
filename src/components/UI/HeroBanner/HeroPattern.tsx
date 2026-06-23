import { Guitar, Headphones, Music } from "lucide-react";
import { useId } from "react";
import { TbGuitarPick } from "react-icons/tb";

interface HeroPatternProps {
  /** Tailwind opacity utility, e.g. "opacity-[0.05]". */
  className?: string;
  /**
   * Where the pattern stays visible. Defaults to the right edge so it sits
   * under the banner's warm glow, mirroring the sign-in background.
   */
  maskImage?: string;
}

/**
 * The tiled guitar / music / pick / headphone pattern from the sign-in screen,
 * reusable as `backgroundContent` for the HeroBanner.
 */
export const HeroPattern = ({
  className = "opacity-[0.05]",
  maskImage = "linear-gradient(to left, black 5%, transparent 35%)",
}: HeroPatternProps) => {
  const patternId = useId();

  return (
    <svg
      aria-hidden="true"
      className={`absolute inset-0 h-full w-full ${className}`}
      style={{ maskImage, WebkitMaskImage: maskImage }}
    >
      <defs>
        <pattern
          id={patternId}
          x="0"
          y="0"
          width="160"
          height="160"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-15)"
        >
          <g transform="translate(20, 20)">
            <Guitar size={32} className="text-white" strokeWidth={1.5} />
          </g>
          <g transform="translate(100, 40)">
            <Music size={28} className="text-white" strokeWidth={1.5} />
          </g>
          <g transform="translate(40, 100)">
            <TbGuitarPick size={30} className="text-white" strokeWidth={1.5} />
          </g>
          <g transform="translate(110, 110)">
            <Headphones size={32} className="text-white" strokeWidth={1.5} />
          </g>
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
};
