import { cn } from "assets/lib/utils";
import { MOBILE_BOTTOM_NAV_ATTR } from "components/RockSidebar/MobileMoreSheet";
import { useHasUnclaimedMilestone } from "feature/aiSummary/hooks/useHasUnclaimedMilestone";
import { useRipple } from "hooks/useRipple";
import { useTranslation } from "hooks/useTranslation";
import { CassetteTape,Home, Menu, Timer, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

interface MobileBottomNavProps {
  onMenuClick: () => void;
  /** The "More" sheet is up — its tab reads as the current one. */
  isMenuOpen?: boolean;
  /** A tab was tapped — the sheet closes even when the tab is the current page. */
  onNavigate?: () => void;
}

/** Both lucide and react-icons components take these — the nav mixes the two. */
type NavIcon = React.ComponentType<{ size?: number; className?: string }>;

// Icons must stay in sync with the sidebar entries in RockSidebar, otherwise the
// same destination shows up with two different glyphs.
const navItems: { label: string; href: string; icon: NavIcon }[] = [
  { label: "home", href: "/dashboard", icon: Home },
  { label: "practice", href: "/timer", icon: Timer },
  { label: "songs", href: "/songs?view=board", icon: CassetteTape },
  { label: "progress", href: "/profile/activity", icon: TrendingUp },
];

const itemClass =
  "relative flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center py-1 active:scale-95 transition-transform duration-fast";

// A pill highlight wraps both the icon and the label of the active item.
const pillClass = (active: boolean) =>
  cn(
    "relative flex w-full max-w-20 flex-col items-center justify-center gap-1 overflow-hidden rounded-lg px-1 py-1.5 transition-colors duration-base",
    active ? "bg-white/10" : "bg-transparent"
  );

const iconClass = (active: boolean) =>
  cn("transition-colors duration-base", active ? "text-white" : "text-zinc-400");

const labelClass = (active: boolean) =>
  cn(
    "whitespace-nowrap text-xs capitalize tracking-tight transition-colors duration-base",
    active ? "font-medium text-white" : "font-normal text-zinc-400"
  );

const BottomNavItem = ({
  label,
  href,
  icon: Icon,
  active,
  onNavigate,
  showBadge = false,
}: {
  label: string;
  href: string;
  icon: NavIcon;
  active: boolean;
  onNavigate?: () => void;
  showBadge?: boolean;
}) => {
  const { t } = useTranslation("nav");
  const { createRipple, ripple } = useRipple("bg-cyan-400/30");
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={(e) => {
        createRipple(e);
        onNavigate?.();
      }}
      className={itemClass}
    >
      <span className={pillClass(active)}>
        {ripple}
        <span className='relative'>
          <Icon
            size={20}
            className={cn(iconClass(active), "transition-transform duration-base", active && "scale-110")}
          />
          {showBadge && (
            <span
              aria-label={t("unclaimed_reward")}
              className='absolute -right-1 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-amber-500'
            />
          )}
        </span>
        <span className={labelClass(active)}>{label}</span>
      </span>
    </Link>
  );
};

export const MobileBottomNav = ({
  onMenuClick,
  isMenuOpen = false,
  onNavigate,
}: MobileBottomNavProps) => {
  const { t } = useTranslation("nav");
  const router = useRouter();
  const { createRipple, ripple } = useRipple("bg-cyan-400/30");
  // Milestones sit behind the Progress tab, so their reward dot does too.
  const hasUnclaimedMilestone = useHasUnclaimedMilestone();

  const isActive = (href: string) => {
    if (href.includes("?")) {
      const [path, query] = href.split("?");
      if (router.pathname === path) {
        const queryParams = new URLSearchParams(query);
        const view = queryParams.get("view");
        return router.query.view === view;
      }
      return false;
    }
    return router.pathname === href;
  };

  return (
    <nav
      {...{ [MOBILE_BOTTOM_NAV_ATTR]: "" }}
      // The open sheet is a modal that switches pointer events off on <body>;
      // the bar opts back in so its tabs keep working underneath.
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[100] border-t border-white/10 bg-zinc-900/95 pb-safe pt-1.5 px-2 backdrop-blur-xl lg:hidden transform-gpu",
        isMenuOpen && "pointer-events-auto"
      )}>
      <div className="mx-auto flex max-w-md items-stretch justify-around gap-0.5">
        {navItems.map((item) => (
          <BottomNavItem
            key={item.href}
            label={t(item.label)}
            href={item.href}
            icon={item.icon}
            active={!isMenuOpen && isActive(item.href)}
            onNavigate={onNavigate}
            showBadge={item.href === "/profile/activity" && hasUnclaimedMilestone}
          />
        ))}

        <button
          onClick={(e) => {
            createRipple(e);
            onMenuClick();
          }}
          aria-label={isMenuOpen ? t("close_menu") : t("open_menu")}
          aria-expanded={isMenuOpen}
          className={itemClass}
        >
          <span className={pillClass(isMenuOpen)}>
            {ripple}
            <Menu size={20} className={iconClass(isMenuOpen)} />
            <span className={labelClass(isMenuOpen)}>{t("more")}</span>
          </span>
        </button>
      </div>
    </nav>
  );
};
