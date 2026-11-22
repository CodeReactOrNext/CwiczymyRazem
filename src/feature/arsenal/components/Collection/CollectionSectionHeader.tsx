import { SectionHeader } from "components/SectionHeader/SectionHeader";
import type { ReactNode } from "react";

interface CollectionSectionHeaderProps {
  title: string;
  owned: number;
  total: number;
  /** What is being counted, e.g. "guitars collected". */
  unit: string;
  /** Optional section-level action, e.g. selling duplicates. */
  action?: ReactNode;
}

/**
 * One heading for both halves of the collection — the shared section header
 * with the "owned / total" count after the title.
 */
export const CollectionSectionHeader = ({
  title,
  owned,
  total,
  unit,
  action,
}: CollectionSectionHeaderProps) => (
  <SectionHeader
    title={title}
    count={`${owned} / ${total} ${unit}`}
    action={action}
    className='mb-0 flex-wrap gap-y-3'
  />
);
