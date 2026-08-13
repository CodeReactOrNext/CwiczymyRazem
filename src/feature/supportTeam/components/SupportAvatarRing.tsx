import { cn } from "assets/lib/utils";
import type { ReactNode } from "react";

/** Gold sweep that only supporters get — nothing else in the app uses it. */
export const SUPPORT_CONIC_GRADIENT =
  "conic-gradient(from 0deg, #b45309, #fbbf24, #fef3c7, #fbbf24, #b45309)";

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
  // and a stretched wrapper would turn them into ellipses.
  <div className={cn("relative inline-flex", className)}>
    <div
      aria-hidden
      className='pointer-events-none absolute animate-spin-slow rounded-full opacity-50 blur-[6px] motion-reduce:animate-none'
      style={{ inset: -(rim + gap + 3), background: SUPPORT_CONIC_GRADIENT }}
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
