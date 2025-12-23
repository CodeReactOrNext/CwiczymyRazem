import { Music, AlertTriangle, ShieldCheck } from "lucide-react";

interface DashboardStatsProps {
  totalSongs: number;
  missingCovers: number;
  unverifiedCount: number;
  noRatingCount: number;
}

export const DashboardStats = ({ totalSongs, missingCovers, unverifiedCount, noRatingCount }: DashboardStatsProps) => {
  const stats = [
    {
      label: "Total Songs",
      value: totalSongs,
      icon: Music,
      color: "text-link",
      bgColor: "bg-link/10",
    },
    {
      label: "Missing Covers",
      value: missingCovers,
      icon: AlertTriangle,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Unverified",
      value: unverifiedCount,
      icon: ShieldCheck,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      label: "No Rating",
      value: noRatingCount,
      icon: AlertTriangle,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-md transition-all hover:bg-zinc-900/60">
          <div className="flex items-center gap-4">
            <div className={`rounded-xl ${stat.bgColor} p-3 ${stat.color} transition-transform group-hover:scale-110`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{stat.label}</p>
              <p className="text-3xl font-black text-white">{stat.value}</p>
            </div>
          </div>
          {/* Subtle gradient accent */}
          <div className={`absolute -bottom-4 -right-4 h-24 w-24 rounded-full ${stat.bgColor} opacity-20 blur-2xl transition-opacity group-hover:opacity-40`} />
        </div>
      ))}
    </div>
  );
};
