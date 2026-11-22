import { cn } from "assets/lib/utils";
import { SECTION_TITLE_CLASSES } from "components/SectionHeader/SectionHeader";
import type { ReactNode } from "react";

interface SectionLabelProps {
  children: ReactNode;
  className?: string;
}

/**
 * The one heading style the workshop uses for a section — the app's section
 * title typography. A span, not a heading, because some of these sit inside a
 * button (the build log toggle) where a heading is not allowed.
 */
export const SectionLabel = ({ children, className }: SectionLabelProps) => (
  <span className={cn(SECTION_TITLE_CLASSES.default, className)}>
    {children}
  </span>
);
