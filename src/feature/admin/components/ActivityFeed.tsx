import { Zap, Trophy, TrendingUp, User, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
  logs: any[];
}

export const ActivityFeed = ({ logs }: ActivityFeedProps) => {
  return (
    <div className="rounded-2xl border border-white/5 bg-zinc-900/20 backdrop-blur-sm overflow-hidden flex flex-col h-full shadow-2xl">
      <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Live Activity Feed</h3>
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03] scrollbar-thin scrollbar-track-zinc-900/40 scrollbar-thumb-zinc-700">
        {logs.map((log) => {
          const isLevelUp = log.newLevel?.isNewLevel;
          const points = log.newLevel?.points || 0;
          
          return (
            <div key={log.id} className="p-4 hover:bg-white/[0.02] transition-colors group">
              <div className="flex items-start gap-4">
                <div className={`mt-1 h-10 w-10 shrink-0 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                  isLevelUp ? "bg-amber-500/20 text-amber-500 shadow-amber-500/10" : "bg-cyan-500/20 text-cyan-500 shadow-cyan-500/10"
                }`}>
                  {isLevelUp ? <Trophy className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-bold text-white truncate">
                      {log.newLevel?.userName || "Anonymous"}
                    </p>
                    <span className="text-[10px] font-bold text-zinc-600 flex items-center gap-1 shrink-0 uppercase">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 items-center text-[11px] font-medium text-zinc-400">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 font-bold uppercase tracking-wider">
                      LVL {log.newLevel?.level || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      earned <span className="text-cyan-400 font-black">+{points} pts</span>
                    </span>
                    {isLevelUp && (
                      <span className="text-amber-500 font-black animate-pulse uppercase tracking-tighter">
                        Level Up! 🚀
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
