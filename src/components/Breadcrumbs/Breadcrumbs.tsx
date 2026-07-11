import { cn } from "assets/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

export interface Crumb {
  label: string;
  /** Omit for the current (last) crumb. */
  href?: string;
}

interface BreadcrumbsProps {
  items: Crumb[];
  /** Color of the current (non-link) crumb; defaults to the hero eyebrow orange. */
  currentClassName?: string;
  className?: string;
}

export const Breadcrumbs = ({
  items,
  currentClassName = "text-orange-400/80",
  className,
}: BreadcrumbsProps) => (
  <nav
    aria-label='Breadcrumb'
    className={cn(
      "mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold tracking-wide",
      className
    )}>
    {items.map((item, i) => (
      <Fragment key={`${item.label}-${i}`}>
        {i > 0 && <ChevronRight className='h-3.5 w-3.5 shrink-0 text-zinc-600' />}
        {item.href ? (
          <Link
            href={item.href}
            className='rounded text-zinc-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
            {item.label}
          </Link>
        ) : (
          <span className={currentClassName}>{item.label}</span>
        )}
      </Fragment>
    ))}
  </nav>
);
