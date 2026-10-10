import { cn } from "assets/lib/utils";
import type { ReactNode } from "react";

/** Gold sweep that only supporters get — nothing else in the app uses it. */
export const SUPPORT_CONIC_GRADIENT =
  "conic-gradient(from 0deg, #b45309, #fbbf24, #fef3c7, #fbbf24, #b45309)";

/**
 * Cuts the spinning disc down to its outer `rim` pixels. The fade starts one
 * pixel further in, under the dark gap: a hard stop in a radial mask renders
 * stair-stepped, and the overlap keeps the seam between gap and rim closed.
 */
export const getRimMask = (rim: number) =>
  `radial-gradient(circle closest-side, transparent calc(100% - ${rim + 1}px), #000 calc(100% - ${rim}px))`;

interface SupportAvatarRingProps {
  children: ReactNode;
  /** Thickness of the rotating rim, in px. */
  rim?: number;
  /** Dark gap between the avatar and the rim, in px. */
  gap?: number;
  className?: string;
}

/**
 * Wraps a circular avatar in a slowly rotating gold rim.
 * The rim is a ring of its own, not a disc the avatar is expected to cover:
 * mobile browsers composite the spinning layer above its later siblings, and a
 * full disc then painted over the whole avatar.
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
        className='pointer-events-none absolute animate-spin-slow rounded-full motion-reduce:animate-none'
        style={{
          inset: -(rim + gap),
          background: SUPPORT_CONIC_GRADIENT,
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
