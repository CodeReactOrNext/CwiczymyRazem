import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { tabNavItemClass, tabNavListClass } from "components/PageTabs/tabNav";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export interface PageTab {
  label: string;
  href: string;
  tooltip?: string;
  /** Short trailing count, e.g. `51/77`. Rendered muted next to the label. */
  badge?: string;
  /** Optional — a tab without one still lines up, it just leads with its label. */
  icon?: LucideIcon;
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
  <nav aria-label={ariaLabel} className={cn(tabNavListClass, className)}>
    {tabs.map(({ label, href, tooltip, badge, icon: Icon }) => {
      const isActive = href === activeHref;
      const link = (
        <Link
          key={href}
          href={href}
          aria-current={isActive ? "page" : undefined}
          className={tabNavItemClass(isActive)}>
          {Icon && <Icon size={16} className='shrink-0' />}
          {label}
          {badge && (
            <span className='text-xs font-semibold tabular-nums text-zinc-500'>
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
            <TooltipContent className='max-w-[200px] text-center'>
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    })}
  </nav>
);
