import { cn } from "assets/lib/utils";
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

export const MobileBottomNav = ({ onMenuClick }: MobileBottomNavProps) => {
  const router = useRouter();

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
      <div className="mx-auto flex max-w-md items-stretch justify-around gap-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 transition-colors duration-200 active:scale-90",
                active ? "text-cyan-400" : "text-zinc-500"
              )}
            >
              <Icon size={20} className="transition-transform" />
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-tight",
                  active ? "opacity-100" : "opacity-60"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-zinc-500 transition-colors duration-200 active:scale-90"
        >
          <Menu size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tight opacity-60">
            More
          </span>
        </button>
      </div>
    </nav>
  );
};
