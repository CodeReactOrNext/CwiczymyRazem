import { cn } from "assets/lib/utils";
import type { ReactNode } from "react";

/**
 * Polished gold lit from the top-left — the bright edge up top, deeper amber
 * underneath. Static on purpose: the shading alone reads as metal, and a ring
 * that moves pulls the eye off whatever the row is actually about.
 * Nothing else in the app uses it, so it stays a supporter's mark.
 */
export const SUPPORT_RIM_GRADIENT =
  "linear-gradient(150deg, #fef3c7 0%, #fbbf24 35%, #d97706 75%, #b45309 100%)";

/**
 * Cuts the gold disc down to its outer `rim` pixels. The fade starts one
 * pixel further in, under the dark gap: a hard stop in a radial mask renders
 * stair-stepped, and the overlap keeps the seam between gap and rim closed.
 */
export const getRimMask = (rim: number) =>
  `radial-gradient(circle closest-side, transparent calc(100% - ${rim + 1}px), #000 calc(100% - ${rim}px))`;

interface SupportAvatarRingProps {
  children: ReactNode;
  /** Thickness of the gold rim, in px. */
  rim?: number;
  /** Dark gap between the avatar and the rim, in px. */
  gap?: number;
  className?: string;
}

/**
 * Wraps a circular avatar in a thin gold rim with a dark gap, like a bezel.
 * The rim is a ring of its own, not a disc the avatar is expected to cover, so
 * nothing about layer order can paint it over the avatar.
 */
export const SupportAvatarRing = ({
  children,
  rim = 2,
  gap = 2,
  className,
}: SupportAvatarRingProps) => {
  const rimMask = getRimMask(rim);

  return (
    // inline-flex so the wrapper hugs the avatar — the rings are square insets,
    // and a stretched wrapper would turn them into ellipses. aspect-square +
    // shrink-0 keep that true even in a cramped flex row (the activity feed).
    <div className={cn("relative inline-flex aspect-square shrink-0", className)}>
      <div
        aria-hidden
        className='pointer-events-none absolute rounded-full'
        style={{
          inset: -(rim + gap),
          background: SUPPORT_RIM_GRADIENT,
          WebkitMaskImage: rimMask,
          maskImage: rimMask,
        }}
      />
      <div
        aria-hidden
        className='pointer-events-none absolute rounded-full bg-zinc-950'
        style={{ inset: -gap }}
      />
      <div className='relative'>{children}</div>
    </div>
  );
};
