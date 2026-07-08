import { cn } from "assets/lib/utils";
import { useRipple } from "hooks/useRipple";
import type { LucideIcon } from "lucide-react";
import { Activity, Home, LayoutGrid, Menu, Timer } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

interface MobileBottomNavProps {
  onMenuClick: () => void;
}

const navItems = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Practice", href: "/timer", icon: Timer },
  { label: "Songs", href: "/songs?view=management", icon: LayoutGrid },
  { label: "Progress", href: "/profile/activity", icon: Activity },
];

const itemClass =
  "relative flex min-h-[52px] flex-1 flex-col items-center justify-center py-1 active:scale-95 transition-transform duration-150";

// A pill highlight wraps both the icon and the label of the active item.
const pillClass = (active: boolean) =>
  cn(
    "relative flex w-16 flex-col items-center justify-center gap-1 overflow-hidden rounded-lg px-2 py-1.5 transition-colors duration-300",
    active ? "bg-white/10" : "bg-transparent"
  );

const iconClass = (active: boolean) =>
  cn("transition-colors duration-300", active ? "text-white" : "text-zinc-400");

const labelClass = (active: boolean) =>
  cn(
    "text-[10px] capitalize tracking-tight transition-colors duration-200",
    active ? "font-medium text-white" : "font-normal text-zinc-500"
  );

const BottomNavItem = ({
  label,
  href,
  icon: Icon,
  active,
}: {
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
}) => {
  const { createRipple, ripple } = useRipple("bg-cyan-400/30");
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={createRipple}
      className={itemClass}
    >
      <span className={pillClass(active)}>
        {ripple}
        <Icon
          size={20}
          className={cn(iconClass(active), "transition-transform duration-300", active && "scale-110")}
        />
        <span className={labelClass(active)}>{label}</span>
      </span>
    </Link>
  );
};

export const MobileBottomNav = ({ onMenuClick }: MobileBottomNavProps) => {
  const router = useRouter();
  const { createRipple, ripple } = useRipple("bg-cyan-400/30");

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
    <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t border-white/10 bg-zinc-900/95 pb-safe pt-1.5 px-2 backdrop-blur-xl lg:hidden transform-gpu">
      <div className="mx-auto flex max-w-md items-stretch justify-around gap-0.5">
        {navItems.map((item) => (
          <BottomNavItem
            key={item.href}
            label={item.label}
            href={item.href}
            icon={item.icon}
            active={isActive(item.href)}
          />
        ))}

        <button
          onClick={(e) => {
            createRipple(e);
            onMenuClick();
          }}
          aria-label="Open menu"
          className={itemClass}
        >
          <span className={pillClass(false)}>
            {ripple}
            <Menu size={20} className={iconClass(false)} />
            <span className={labelClass(false)}>More</span>
          </span>
        </button>
      </div>
    </nav>
  );
};
