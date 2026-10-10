import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import {
  tabNavFadeClass,
  tabNavItemClass,
  tabNavListClass,
} from "components/PageTabs/tabNav";
import { useRailEdges } from "components/PageTabs/useRailEdges";
import { useTranslation } from "hooks/useTranslation";
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

const tabKey = (href: string) =>
  href.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "_");

export const PageTabs = ({
  tabs,
  activeHref,
  ariaLabel = "Sections",
  className,
}: PageTabsProps) => {
  const { t } = useTranslation("nav");
  const { ref, edges } = useRailEdges<HTMLElement>();
  return (
  <nav
    ref={ref}
    aria-label={ariaLabel}
    className={cn(tabNavListClass, tabNavFadeClass(edges), className)}>
    {tabs.map(({ label, href, tooltip, badge, icon: Icon }) => {
      const isActive = href === activeHref;
      // Tabs are defined in English next to their routes; the route is the key.
      const key = `page_tabs.${tabKey(href)}`;
      const link = (
        <Link
          key={href}
          href={href}
          aria-current={isActive ? "page" : undefined}
          className={tabNavItemClass(isActive)}>
          {Icon && <Icon size={16} className='shrink-0' />}
          {t(`${key}.label`, label)}
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
              <p>{t(`${key}.tooltip`, tooltip)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    })}
  </nav>
  );
};
