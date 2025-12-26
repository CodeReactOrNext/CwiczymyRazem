import { ReactNode, useState } from "react";
import { 
  Music, 
  Menu,
  ChevronLeft,
  LogOut,
  Zap,
  LayoutDashboard,
  Users,
  Settings,
  Database,
  ChevronRight,
  ShieldCheck,
  SearchCheck
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "assets/lib/utils";
import { Button } from "assets/components/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
  onLogout?: () => void;
}

const AdminLayout = ({ children, onLogout }: AdminLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();

  const menuItems = [
    { name: "Inventory", href: "/admin", icon: Music },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Discovery", href: "/admin/discovery", icon: SearchCheck },
  ];

  return (
    <div className="flex min-h-screen bg-[#050505] text-zinc-400">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-white/5 bg-zinc-950/50 backdrop-blur-3xl transition-all duration-300",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="flex h-full flex-col p-4">
          {/* Logo/Brand */}
          <div className="mb-10 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="h-6 w-6 text-black" />
            </div>
            {!isCollapsed && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                <h1 className="text-lg font-black tracking-tight text-white">ADMIN</h1>
                <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-500">Riff Quest</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div className={cn(
                    "flex flex-col group cursor-pointer"
                  )}>
                    <div className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200",
                      isActive 
                        ? "bg-cyan-500/10 text-cyan-500 shadow-inner" 
                        : "hover:bg-white/[0.03] hover:text-white"
                    )}>
                      <item.icon className={cn("h-5 w-5", isActive ? "text-cyan-500" : "text-zinc-500 group-hover:text-white")} />
                      {!isCollapsed && <span className="text-sm font-bold">{item.name}</span>}
                      {isActive && !isCollapsed && (
                         <div className="ml-auto h-1 w-1 rounded-full bg-cyan-500 shadow-[0_0_8px_cyan]" />
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="mt-auto space-y-2 pt-10 border-t border-white/5">
            <Button 
               variant="ghost" 
               onClick={() => setIsCollapsed(!isCollapsed)}
               className="w-full justify-start px-3 hover:bg-white/[0.03]"
            >
              {isCollapsed ? <ChevronRight className="h-5 w-5" /> : (
                <>
                  <ChevronLeft className="mr-3 h-5 w-5" />
                  <span className="text-sm font-bold">Collapse</span>
                </>
              )}
            </Button>
            <Button 
               variant="ghost" 
               onClick={onLogout}
               className="w-full justify-start px-3 text-red-500/70 hover:bg-red-500/10 hover:text-red-500"
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3 text-sm font-bold">Log Out</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main 
        className={cn(
          "flex-1 transition-all duration-300",
          isCollapsed ? "pl-20" : "pl-64"
        )}
      >
        <div className="mx-auto min-h-screen max-w-7xl">
           {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
