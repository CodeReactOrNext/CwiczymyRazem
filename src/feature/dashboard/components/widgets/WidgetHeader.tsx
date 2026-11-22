import { SectionHeader, SectionLink } from "components/SectionHeader/SectionHeader";
import type { ReactNode } from "react";

interface WidgetHeaderProps {
  title: string;
  action?: ReactNode;
  /** A number after the title, e.g. progress towards a goal. */
  count?: ReactNode;
  className?: string;
}

/** The title every dashboard card opens with — the shared section header at card level. */
export const WidgetHeader = ({
  title,
  action,
  count,
  className,
}: WidgetHeaderProps) => (
  <SectionHeader
    title={title}
    action={action}
    count={count}
    as='h3'
    className={className}
  />
);

/** "See all" in the corner of a card — text only, so it never competes with the numbers. */
export const WidgetLink = SectionLink;
