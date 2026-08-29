/* eslint-disable @next/next/no-img-element */
import { cn } from "assets/lib/utils";

interface SupportTokenProps {
  /** Rendered size in pixels, matched to the text it sits beside. */
  size?: number;
  className?: string;
}

/**
 * The support token, at the size of the text it stands next to.
 *
 * Tokens are the supporter allowance — the roadmap, the gear board, the case
 * slate, the goal ballot and founding a guild all charge in them — and every
 * one of those screens used to draw a generic coin glyph. One asset in one
 * component means a price on the gear board is read as the same currency the
 * wallet in the header counts, and re-drawing the token is a file to replace
 * rather than a sweep through the features.
 *
 * Served from a 128px cut of the artwork rather than the full-size original:
 * `next.config` runs with `images.unoptimized`, so whatever is referenced here
 * is what every player downloads.
 */
export const SupportToken = ({ size = 18, className }: SupportTokenProps) => (
  <img
    src='/images/support-token-icon.webp'
    alt=''
    aria-hidden
    width={size}
    height={size}
    className={cn("shrink-0 object-contain", className)}
    style={{ width: size, height: size }}
  />
);

export default SupportToken;
