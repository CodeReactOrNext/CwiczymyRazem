import { cn } from "assets/lib/utils";
import type { ReactNode } from "react";

/** Gold sweep that only supporters get — nothing else in the app uses it. */
export const SUPPORT_CONIC_GRADIENT =
  "conic-gradient(from 0deg, #b45309, #fbbf24, #fef3c7, #fbbf24, #b45309)";

/** Flat gold the halo is blurred from — see the comment on the glow layer. */
export const SUPPORT_GLOW_COLOR = "rgba(251, 191, 36, 0.45)";

interface SupportAvatarRingProps {
  children: ReactNode;
  /** Thickness of the rotating rim, in px. */
  rim?: number;
  /** Dark gap between the avatar and the rim, in px. */
  gap?: number;
  className?: string;
}

/**
 * Wraps an (opaque, circular) avatar in a slowly rotating gold rim + glow.
 * The avatar itself masks the middle of the gradient disc, which is what turns
 * it into a ring — so whatever is passed in has to stay round and opaque.
 */
export const SupportAvatarRing = ({
  children,
  rim = 2,
  gap = 2,
  className,
}: SupportAvatarRingProps) => (
  // inline-flex so the wrapper hugs the avatar — the rings are square insets,
  // and a stretched wrapper would turn them into ellipses. aspect-square +
  // shrink-0 keep that true even in a cramped flex row (the activity feed).
  <div className={cn("relative inline-flex aspect-square shrink-0", className)}>
    {/* Flat gold, not the conic sweep: blurring the sweep left the halo almost
        dark where the gradient starts and near-white on the opposite side, so
        the glow read as a squashed oval under the avatar instead of a circle. */}
    <div
      aria-hidden
      className='pointer-events-none absolute rounded-full blur-[7px]'
      style={{ inset: -(rim + gap + 4), background: SUPPORT_GLOW_COLOR }}
    />
    <div
      aria-hidden
      className='pointer-events-none absolute animate-spin-slow rounded-full motion-reduce:animate-none'
      style={{ inset: -(rim + gap), background: SUPPORT_CONIC_GRADIENT }}
    />
    <div
      aria-hidden
      className='pointer-events-none absolute rounded-full bg-zinc-950'
      style={{ inset: -gap }}
    />
    <div className='relative'>{children}</div>
  </div>
);
