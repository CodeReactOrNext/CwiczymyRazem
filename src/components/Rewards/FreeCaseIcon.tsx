import { cn } from "assets/lib/utils";

interface FreeCaseIconProps {
  /** Rendered edge in px — the art is square. */
  size?: number;
  className?: string;
}

/**
 * The free case token, drawn in the same glossy set as the Fame coin so the two
 * currencies read as siblings wherever they sit side by side.
 */
export const FreeCaseIcon = ({ size = 16, className }: FreeCaseIconProps) => (
  <img
    src='/images/tokens/ticket.png'
    alt=''
    aria-hidden
    draggable={false}
    className={cn("shrink-0 select-none object-contain", className)}
    style={{ width: size, height: size }}
  />
);
