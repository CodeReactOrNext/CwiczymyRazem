import { cn } from "assets/lib/utils";
import type { ReactNode } from "react";

interface SectionLabelProps {
  children: ReactNode;
  className?: string;
}

/**
 * The one heading style the workshop uses for a section.
 *
 * The bench, the rack and the bills each used to name their sections in a
 * different weight and size, which made the same role read as three different
 * levels of importance depending on where you looked.
 */
export const SectionLabel = ({ children, className }: SectionLabelProps) => (
  <span
    className={cn(
      "text-xs font-bold tracking-[0.2em] text-zinc-400",
      className,
    )}>
    {children}
  </span>
);
