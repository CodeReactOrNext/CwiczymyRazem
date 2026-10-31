import { cn } from "assets/lib/utils";
import type { ReactNode } from "react";

interface PlanSectionProps {
  index: number;
  title: string;
  hint?: string;
  aside?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** One numbered step of the auto-planner form, on its own card. */
export const PlanSection = ({
  index,
  title,
  hint,
  aside,
  children,
  className,
}: PlanSectionProps) => (
  <section className={cn("rounded-lg bg-zinc-900/40 p-5 sm:p-7", className)}>
    <div className='flex items-start justify-between gap-4'>
      <div className='flex gap-4'>
        <span className='pt-0.5 text-xs font-medium tabular-nums text-zinc-500'>
          {String(index).padStart(2, "0")}
        </span>
        <div>
          <h2 className='text-base font-semibold text-zinc-100'>{title}</h2>
          {hint && (
            <p className='mt-1 max-w-lg text-sm leading-relaxed text-zinc-400'>
              {hint}
            </p>
          )}
        </div>
      </div>
      {aside}
    </div>
    {children && <div className='mt-7 sm:pl-8'>{children}</div>}
  </section>
);
