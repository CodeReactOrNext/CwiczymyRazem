import { cn } from "assets/lib/utils";
import { FileText,Home, LayoutGrid, Menu, Timer } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

interface MobileBottomNavProps {
  onMenuClick: () => void;
}

export const MobileBottomNav = ({ onMenuClick }: MobileBottomNavProps) => {
  const router = useRouter();

  const navItems = [
    {
      label: "Home",
      href: "/dashboard",
      icon: Home,
    },
    {
      label: "Practice",
      href: "/timer",
      icon: Timer,
    },
    {
      label: "Reports",
      href: "/report",
      icon: FileText,
    },
    {
      label: "My Songs",
      href: "/songs?view=management",
      icon: LayoutGrid,
    },
  ];

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
    <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t border-white/10 bg-zinc-900/95 pb-safe pt-2 px-2 backdrop-blur-xl lg:hidden transform-gpu">
      <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 transition-all active:scale-95",
                active ? "text-cyan-400" : "text-zinc-500"
              )}
            >
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300",
                active ? "bg-cyan-500/15 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "bg-transparent"
              )}>
                <Icon size={18} className={cn(
                    "transition-transform",
                    active && "scale-105"
                )} />
              </div>
              <span className={cn(
                  "text-[10px] font-bold uppercase tracking-tight transition-opacity",
                  active ? "opacity-100" : "opacity-60"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
        
        <button
          onClick={onMenuClick}
          className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 transition-all text-zinc-500 active:scale-95"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
            <Menu size={18} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-tight opacity-60">
            More
          </span>
        </button>
      </div>
    </nav>
  );
};
