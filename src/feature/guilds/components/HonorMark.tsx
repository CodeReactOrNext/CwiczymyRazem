import { cn } from "assets/lib/utils";

/**
 * The mark honor wears wherever it is counted: one icon, so a number next to
 * it on the roster, on the shelf and in a price is read as the same currency.
 * The shield-and-star artwork the owner picked for it — reused as one asset
 * here rather than redrawn per spot, the same reasoning `FameCoin` and
 * `SupportToken` follow for their own currencies. Drawn a size up from a
 * typical inline icon everywhere it appears, so the artwork actually reads.
 */
export const HonorMark = ({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) => (
  // eslint-disable-next-line @next/next/no-img-element -- unoptimized build, same pattern as FameCoin/SupportToken
  <img
    src='/images/honor-icon.png'
    alt=''
    aria-hidden
    width={size}
    height={size}
    className={cn("shrink-0 object-contain", className)}
    style={{ width: size, height: size }}
  />
);
