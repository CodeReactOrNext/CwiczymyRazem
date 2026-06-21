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
  "relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-lg py-1 active:scale-95 transition-transform duration-150";

// Material-3 style: a pill highlight sits behind the icon of the active item
// instead of tinting the whole cell.
const pillClass = (active: boolean) =>
  cn(
    "relative flex h-7 w-14 items-center justify-center overflow-hidden rounded-lg transition-colors duration-300",
    active ? "bg-cyan-500/15 text-cyan-300" : "text-zinc-400"
  );

const labelClass = (active: boolean) =>
  cn(
    "text-[10px] capitalize tracking-tight transition-colors duration-200",
    active ? "font-medium text-cyan-300" : "font-normal text-zinc-500"
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
        <Icon size={20} className={cn("transition-transform duration-300", active && "scale-110")} />
      </span>
      <span className={labelClass(active)}>{label}</span>
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
            <Menu size={20} />
          </span>
          <span className={labelClass(false)}>More</span>
        </button>
      </div>
    </nav>
  );
};
