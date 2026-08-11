import type { ReactNode } from "react";

interface CollectionSectionHeaderProps {
  eyebrow: string;
  title: string;
  owned: number;
  total: number;
  /** What is being counted, e.g. "guitars collected". */
  unit: string;
  /** Optional section-level action, e.g. selling duplicates. */
  action?: ReactNode;
}

/**
 * One heading for both halves of the collection.
 *
 * Guitars used to open with a bare counter and pedals with an eyebrow + title,
 * so the same kind of section read as two different levels of the page.
 */
export const CollectionSectionHeader = ({
  eyebrow,
  title,
  owned,
  total,
  unit,
  action,
}: CollectionSectionHeaderProps) => (
  <div className='flex flex-wrap items-end justify-between gap-x-6 gap-y-3'>
    <div className='flex flex-col gap-0.5'>
      <p className='text-[9px] font-bold capitalize tracking-[0.2em] text-zinc-500'>
        {eyebrow}
      </p>
      <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
        <p className='text-base font-black capitalize tracking-wide text-white'>
          {title}
        </p>
        <p className='flex items-baseline gap-1.5'>
          <span className='text-sm font-black tabular-nums text-zinc-200'>
            {owned}
          </span>
          <span className='text-xs font-bold text-zinc-500'>/ {total}</span>
          <span className='text-xs font-medium text-zinc-400'>{unit}</span>
        </p>
      </div>
    </div>

    {action}
  </div>
);
