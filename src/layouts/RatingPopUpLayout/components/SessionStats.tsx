import { Card } from "assets/components/ui/card";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { Activity, BookOpen, Clock, Headphones, Minus,Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { convertMsToHM } from "utils/converter";

interface SessionStatsProps {
  time: number;
  breakdown?: {
    technique: number;
    theory: number;
    hearing: number;
    creativity: number;
  };
  todayTotalTime: number;
  averageWeeklyTime: number;
}

export const SessionStats = ({
  time,
  breakdown,
  todayTotalTime,
  averageWeeklyTime,
}: SessionStatsProps) => {
  const { t } = useTranslation(["report", "timer", "common"]) as any;

  const formatMs = (ms: number) => {
    if (ms <= 0) return null;
    const totalMinutes = Math.round(ms / 60000);
    if (totalMinutes === 0) return "< 1m";
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${mins > 0 ? `${mins}m` : ""}`;
    return `${mins}m`;
  };

  const performanceDiff = averageWeeklyTime > 0 
    ? ((todayTotalTime - averageWeeklyTime) / averageWeeklyTime) * 100 
    : 0;

  const practiceCategories = [
    { key: "technique", label: t("timer:technique"), value: breakdown?.technique || 0, icon: Activity, color: "text-amber-400", bg: "bg-amber-400/10" },
    { key: "hearing", label: t("timer:hearing"), value: breakdown?.hearing || 0, icon: Headphones, color: "text-cyan-400", bg: "bg-cyan-400/10" },
    { key: "theory", label: t("timer:theory"), value: breakdown?.theory || 0, icon: BookOpen, color: "text-purple-400", bg: "bg-purple-400/10" },
    { key: "creativity", label: t("timer:creativity"), value: breakdown?.creativity || 0, icon: Sparkles, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ].filter(cat => cat.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}>
      <Card className='border-none bg-zinc-900/60 backdrop-blur-2xl h-full overflow-hidden rounded-lg shadow-2xl relative'>
        <div className="absolute top-0 right-0 p-6">
             <div className="h-12 w-12 rounded-lg bg-cyan-500/10 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                  <Clock className="h-6 w-6 text-cyan-400" />
             </div>
        </div>

        <div className='p-8'>
          <div className="mb-10">
              <h3 className='text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-2'>{t("timer:practice_session")}</h3>
              <div className="flex items-baseline gap-4">
                <span className="text-5xl font-black text-white tracking-tighter drop-shadow-2xl">{convertMsToHM(time)}</span>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5">
                    {performanceDiff > 5 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> : performanceDiff < -5 ? <TrendingDown className="h-3.5 w-3.5 text-orange-400" /> : <Minus className="h-3.5 w-3.5 text-zinc-500" />}
                    <span className={`text-[11px] font-black ${performanceDiff > 5 ? 'text-emerald-400' : performanceDiff < -5 ? 'text-orange-400' : 'text-zinc-500'}`}>
                        {Math.abs(performanceDiff).toFixed(0)}%
                    </span>
                </div>
              </div>
          </div>

          <div className="grid gap-6">
             {practiceCategories.map((cat, index) => (
                <motion.div 
                    key={cat.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + (index * 0.1) }}
                    className="group"
                >
                    <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-lg ${cat.bg} flex items-center justify-center border-none group-hover:scale-110 transition-transform duration-300`}>
                                <cat.icon className={`h-5 w-5 ${cat.color}`} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-1.5">{cat.key}</span>
                                <span className="text-sm font-bold text-zinc-200 uppercase tracking-tight">{cat.label}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-base font-black text-white">{formatMs(cat.value)}</span>
                        </div>
                    </div>
                    <div className="relative h-1 w-full bg-white/[0.04] rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 1.5, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className={`h-full bg-gradient-to-r from-transparent via-white/20 to-white/60 opacity-20`}
                        />
                    </div>
                </motion.div>
             ))}
          </div>

          {practiceCategories.length === 0 && (
             <div className="py-12 text-center bg-white/5 rounded-lg border-none mt-6">
                <Sparkles className="h-8 w-8 text-zinc-800 mx-auto mb-4" />
                <p className="text-[11px] text-zinc-600 font-black uppercase tracking-[0.2em]">Data unavailable</p>
             </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
