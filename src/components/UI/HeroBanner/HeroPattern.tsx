import {
  Bot,
  Brain,
  CheckCircle2,
  ClipboardList,
  Clock,
  Compass,
  Dices,
  FileMusic,
  FolderOpen,
  Guitar,
  Headphones,
  Heart,
  type LucideIcon,
  Map,
  Music,
  Music4,
  NotebookPen,
  RefreshCw,
  Sparkles,
  Target,
  Timer,
  UploadCloud,
  Wand2,
} from "lucide-react";
import { useId } from "react";
import { TbGuitarPick } from "react-icons/tb";

type PatternVariant = "guitar" | "heart" | "shuffle" | "timer" | "log" | "tabs" | "ai";

const ICON_SETS: Record<PatternVariant, [LucideIcon, LucideIcon, LucideIcon | typeof TbGuitarPick, LucideIcon]> = {
  guitar: [Guitar, Music, TbGuitarPick, Headphones],
  heart: [Heart, Heart, Heart, Heart],
  shuffle: [Wand2, Sparkles, Dices, RefreshCw],
  timer: [Timer, Clock, Target, Music],
  log: [NotebookPen, ClipboardList, CheckCircle2, Music],
  tabs: [FileMusic, FolderOpen, Music4, UploadCloud],
  ai: [Bot, Brain, Map, Compass],
};

interface HeroPatternProps {
  /** Tailwind opacity utility, e.g. "opacity-[0.05]". */
  className?: string;
  /**
   * Where the pattern stays visible. Defaults to the right edge so it sits
   * under the banner's warm glow, mirroring the sign-in background.
   */
  maskImage?: string;
  /** Which icon set to tile. Defaults to the guitar/music/pick/headphone set from the sign-in screen. */
  variant?: PatternVariant;
  /**
   * Paint the tiled icons with a horizontal two-stop gradient instead of flat
   * white, e.g. `["#22d3ee", "#f59e0b"]`. The gradient spans the whole element,
   * not each icon, so the tiling reads as one sweep across the surface.
   */
  gradient?: [from: string, to: string];
  /** @deprecated use variant="heart" */
  withHeart?: boolean;
  /** @deprecated use variant="shuffle" */
  withShuffle?: boolean;
}

/**
 * A tiled icon pattern, reusable as `backgroundContent` for the HeroBanner.
 * Each page picks the icon set that matches its theme via `variant`.
 */
export const HeroPattern = ({
  className = "opacity-[0.05]",
  maskImage = "linear-gradient(to left, black 5%, transparent 35%)",
  variant,
  gradient,
  withHeart = false,
  withShuffle = false,
}: HeroPatternProps) => {
  const patternId = useId();
  const gradientId = `${patternId}-gradient`;
  const maskId = `${patternId}-mask`;
  const resolvedVariant: PatternVariant = variant ?? (withHeart ? "heart" : withShuffle ? "shuffle" : "guitar");
  const [IconA, IconB, IconC, IconD] = ICON_SETS[resolvedVariant];

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
            <IconA size={32} className="text-white" strokeWidth={1.5} />
          </g>
          <g transform="translate(100, 40)">
            <IconB size={28} className="text-white" strokeWidth={1.5} />
          </g>
          <g transform="translate(40, 100)">
            <IconC size={30} className="text-white" strokeWidth={1.5} />
          </g>
          <g transform="translate(110, 110)">
            <IconD size={32} className="text-white" strokeWidth={1.5} />
          </g>
        </pattern>

        {gradient && (
          <>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={gradient[0]} />
              <stop offset="100%" stopColor={gradient[1]} />
            </linearGradient>
            {/* The white icons become a luminance mask, so the gradient rect
                below is what actually gets painted — and because that rect
                spans the element, one sweep runs across every tile instead of
                repeating inside each icon. */}
            <mask id={maskId}>
              <rect x="0" y="0" width="100%" height="100%" fill={`url(#${patternId})`} />
            </mask>
          </>
        )}
      </defs>

      {gradient ? (
        <rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} mask={`url(#${maskId})`} />
      ) : (
        <rect x="0" y="0" width="100%" height="100%" fill={`url(#${patternId})`} />
      )}
    </svg>
  );
};
