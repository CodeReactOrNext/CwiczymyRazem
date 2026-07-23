import { cn } from "assets/lib/utils";
import type { ReactNode } from "react";

interface AuroraGlowFrameProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps a screenshot / glass-card panel in a soft, multi-tone cyan aurora
 * glow. This is the "abstract box" motif from the redesign brief (see PR
 * #749 discussion, inspired by perplexity.ai/api-platform): every zigzag
 * section used to hand-roll its own single-tone `radial-gradient(...)
 * blur-2xl` glow div behind its screenshot. Centralizing it here means one
 * fix improves every section at once.
 *
 * This used to also embed the tiled `GuitarPatternBackground` texture, but
 * that meant the pattern rendered inside a small, arbitrarily-sized
 * `-inset-10` box wherever this frame was used (7 places across the
 * landing page). A tiled pattern doesn't fade at a rectangular boundary,
 * so every one of those boxes showed a hard, visibly cropped edge, and the
 * texture stopped reading as ambience and started reading as noise. The
 * pattern now lives ONLY where it can occupy a full section (Footer,
 * TestimonialsSection) so its edges always coincide with a real layout
 * boundary instead of floating mid-page.
 */
export const AuroraGlowFrame = ({
  children,
  className,
}: AuroraGlowFrameProps) => {
  return (
    <div className={cn("relative", className)}>
      <div className='pointer-events-none absolute -inset-10'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_28%_25%,rgba(34,211,238,0.22),transparent_60%)] blur-3xl' />
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_78%_72%,rgba(8,145,178,0.16),transparent_55%)] blur-3xl' />
        <div className='absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.05)_50%,transparent_60%)]' />
      </div>
      <div className='relative z-10'>{children}</div>
    </div>
  );
};
