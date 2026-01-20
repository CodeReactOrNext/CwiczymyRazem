import { Star, TrendingUp,Users } from "lucide-react";

interface UserAnalyticsProps {
  totalUsers: number;
  recentUsers: number;
}

export const UserAnalytics = ({ totalUsers, recentUsers }: UserAnalyticsProps) => {
  const stats = [
    {
      label: "Total Registrations",
      value: totalUsers,
      icon: Users,
      color: "text-link",
      bgColor: "bg-link/10",
      description: "Lifetime users"
    },
    {
      label: "Recent Activity",
      value: recentUsers,
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      description: "Added last 7 days"
    },
    {
      label: "Engagement Rate",
      value: "94%",
      icon: Star,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      description: ""
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
      {stats.map((stat) => (
        <div key={stat.label} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-md transition-all hover:bg-zinc-900/60">
          <div className="flex items-center gap-5">
            <div className={`rounded-2xl ${stat.bgColor} p-4 ${stat.color} transition-transform group-hover:scale-110 shadow-lg shadow-black/20`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-white">{stat.value}</p>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">{stat.description}</p>
              </div>
            </div>
          </div>
          <div className={`absolute -bottom-4 -right-4 h-24 w-24 rounded-full ${stat.bgColor} opacity-20 blur-3xl transition-opacity group-hover:opacity-40`} />
        </div>
      ))}
    </div>
  );
};
