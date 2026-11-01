import { cn } from "assets/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface WidgetHeaderProps {
  title: string;
  action?: ReactNode;
  className?: string;
}

/** The title every dashboard card opens with. */
export const WidgetHeader = ({
  title,
  action,
  className,
}: WidgetHeaderProps) => (
  <div
    className={cn("mb-4 flex items-center justify-between gap-3", className)}>
    <h3 className='text-base font-semibold text-zinc-100'>
      {title}
    </h3>
    {action}
  </div>
);

interface WidgetLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/** "See all" in the corner of a card — text only, so it never competes with the numbers. */
export const WidgetLink = ({ href, children, className }: WidgetLinkProps) => (
  <Link
    href={href}
    className={cn(
      "flex shrink-0 items-center gap-1 rounded text-xs font-semibold text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 hover:text-zinc-100",
      className,
    )}>
    {children}
    <ArrowRight size={12} />
  </Link>
);
