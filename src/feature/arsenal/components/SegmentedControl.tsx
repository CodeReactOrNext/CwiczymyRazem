import { cn } from "assets/lib/utils";
import type { ReactNode } from "react";

/** One pill of a segmented control — the Dex and Commissions toolbars are made of nothing else. */
export const Segment = ({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) => (
  <button
    type='button'
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
      active
        ? "bg-zinc-100/10 text-zinc-100"
        : "text-zinc-400 hover:bg-zinc-100/5 hover:text-zinc-200",
      className,
    )}>
    {children}
  </button>
);

export const SegmentGroup = ({ children }: { children: ReactNode }) => (
  <div className='no-scrollbar flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg bg-arsenal-section p-1'>
    {children}
  </div>
);
