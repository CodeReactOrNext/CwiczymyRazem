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
    {tabs.map(({ label, href, tooltip }) => {
      const isActive = href === activeHref;
      const link = (
        <Link
          key={href}
          href={href}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            isActive
              ? "bg-zinc-800 text-white"
              : "text-zinc-500 hover:text-zinc-300"
          )}>
          {label}
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
