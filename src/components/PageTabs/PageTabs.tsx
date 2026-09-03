import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import Link from "next/link";

export interface PageTab {
  label: string;
  href: string;
  tooltip?: string;
  /** Short trailing count, e.g. `51/77`. Rendered muted next to the label. */
  badge?: string;
}

interface PageTabsProps {
  tabs: PageTab[];
  activeHref: string;
  ariaLabel?: string;
  className?: string;
}

export const PageTabs = ({
  tabs,
  activeHref,
  ariaLabel = "Sections",
  className,
}: PageTabsProps) => (
  <nav
    aria-label={ariaLabel}
    className={cn(
      "flex h-auto max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-zinc-900 p-1 no-scrollbar",
      className
    )}>
    {tabs.map(({ label, href, tooltip, badge }) => {
      const isActive = href === activeHref;
      const link = (
        <Link
          key={href}
          href={href}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50",
            isActive
              ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
              : "text-zinc-400 hover:text-zinc-300"
          )}>
          {label}
          {badge && (
            <span
              className={cn(
                "ml-2 text-xs font-semibold tabular-nums",
                isActive ? "text-zinc-500" : "text-zinc-600"
              )}>
              {badge}
            </span>
          )}
        </Link>
      );

      if (!tooltip) return link;

      return (
        <TooltipProvider key={href}>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent className="max-w-[200px] text-center">
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    })}
  </nav>
);
