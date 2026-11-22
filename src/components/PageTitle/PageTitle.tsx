import { cn } from "assets/lib/utils";
import type { ReactNode } from "react";

/** The one page-title scale; HeroBanner's h1 uses the same classes. */
export const pageTitleClass = "text-2xl font-bold leading-tight text-zinc-50 md:text-3xl";
export const pageSubtitleClass = "mt-1 text-sm font-medium text-zinc-400";

interface PageTitleProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Small line above the title; callers may colour it. */
  eyebrow?: ReactNode;
  /** Right-aligned on wider screens, below the title on phones. */
  actions?: ReactNode;
  className?: string;
  as?: "h1" | "h2";
}

export const PageTitle = ({
  title,
  subtitle,
  eyebrow,
  actions,
  className,
  as: Heading = "h1",
}: PageTitleProps) => {
  const text = (
    <div className='min-w-0'>
      {eyebrow && (
        <div className='mb-1 text-xs font-semibold text-zinc-400'>{eyebrow}</div>
      )}
      <Heading className={pageTitleClass}>{title}</Heading>
      {subtitle && <p className={pageSubtitleClass}>{subtitle}</p>}
    </div>
  );

  if (!actions) return <div className={className}>{text}</div>;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}>
      {text}
      <div className='flex shrink-0 items-center gap-2'>{actions}</div>
    </div>
  );
};
