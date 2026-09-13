import { cn } from "assets/lib/utils";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface WidgetHeaderProps {
  icon: LucideIcon;
  title: string;
  /** Only when the icon carries meaning (streak = orange, Fame = amber); grey otherwise. */
  iconClassName?: string;
  action?: ReactNode;
  className?: string;
}

/** The same small label the Daily Quests and This Week cards open with. */
export const WidgetHeader = ({
  icon: Icon,
  title,
  iconClassName,
  action,
  className,
}: WidgetHeaderProps) => (
  <div
    className={cn("mb-4 flex items-center justify-between gap-3", className)}>
    <div className='flex items-center gap-3'>
      <Icon size={18} className={cn("shrink-0 text-zinc-500", iconClassName)} />
      <h3 className='text-[12px] font-semibold tracking-wide text-zinc-400'>
        {title}
      </h3>
    </div>
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
