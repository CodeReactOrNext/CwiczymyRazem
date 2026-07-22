import { cn } from "assets/lib/utils";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import type { ReactNode } from "react";

interface AuroraGlowFrameProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps a screenshot / glass-card panel in a soft, multi-tone cyan aurora
 * glow plus the tiled guitar-icon texture (`GuitarPatternBackground`).
 *
 * This is the "abstract box" motif from the redesign brief (see PR #749
 * discussion, inspired by perplexity.ai/api-platform): every zigzag section
 * used to hand-roll its own single-tone `radial-gradient(...) blur-2xl` glow
 * div behind its screenshot. Centralizing it here means one fix improves
 * every section at once, and lets the SVG pattern sit on a genuinely lighter,
 * glowing surface where it's actually visible, instead of at ~3-5% opacity
 * directly on near-black `bg-zinc-950`.
 */
export const AuroraGlowFrame = ({
  children,
  className,
}: AuroraGlowFrameProps) => {
  return (
    <div className={cn("relative", className)}>
      <div className='pointer-events-none absolute -inset-10'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_28%_25%,rgba(34,211,238,0.24),transparent_60%)] blur-3xl' />
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_78%_72%,rgba(8,145,178,0.18),transparent_55%)] blur-3xl' />
        <div className='absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)]' />
        <GuitarPatternBackground opacity={0.09} scale={1.15} />
      </div>
      <div className='relative z-10'>{children}</div>
    </div>
  );
};
