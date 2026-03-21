import { Card } from "assets/components/ui/card";
import CreativityIcon from "components/Icon/CreativityIcon";
import HearingIcon from "components/Icon/HearingIcon";
import TechniqueIcon from "components/Icon/TechniqueIcon";
import TheoryIcon from "components/Icon/TheoryIcon";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { Clock, Minus, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import type { ComponentType } from "react";
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

  const practiceCategories: { key: string; label: string; value: number; icon: ComponentType<{ className?: string; size?: "small" | "medium" | "large" }>; color: string; bg: string }[] = [
    { key: "technique", label: t("timer:technique"), value: breakdown?.technique || 0, icon: TechniqueIcon, color: "text-amber-400", bg: "bg-amber-400/10" },
    { key: "hearing", label: t("timer:hearing"), value: breakdown?.hearing || 0, icon: HearingIcon, color: "text-cyan-400", bg: "bg-cyan-400/10" },
    { key: "theory", label: t("timer:theory"), value: breakdown?.theory || 0, icon: TheoryIcon, color: "text-purple-400", bg: "bg-purple-400/10" },
    { key: "creativity", label: t("timer:creativity"), value: breakdown?.creativity || 0, icon: CreativityIcon, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ].filter(cat => cat.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="h-full">
      <Card className='bg-zinc-900 border border-white/5 h-full rounded-2xl relative shadow-none'>
        <div className="absolute top-0 right-0 p-5">
             <div className="h-10 w-10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-zinc-500" />
             </div>
        </div>

        <div className='p-6'>
          <div className="mb-8">
              <h3 className='text-[11px] uppercase tracking-widest font-semibold text-zinc-500 mb-2'>{t("timer:practice_session")}</h3>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-white tracking-tight">{convertMsToHM(time)}</span>
                <div className="flex items-center gap-1" title="vs. weekly average">
                    {performanceDiff > 5 ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : performanceDiff < -5 ? <TrendingDown className="h-3 w-3 text-orange-500" /> : <Minus className="h-3 w-3 text-zinc-600" />}
                    <span className={`text-[10px] font-bold ${performanceDiff > 5 ? 'text-emerald-500' : performanceDiff < -5 ? 'text-orange-500' : 'text-zinc-600'}`}>
                        {Math.abs(performanceDiff).toFixed(0)}% vs avg
                    </span>
                </div>
              </div>
          </div>

          <div className="grid gap-4">
             {practiceCategories.map((cat, index) => (
                <motion.div
                    key={cat.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + (index * 0.1) }}
                    className="group"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg ${cat.bg} flex items-center justify-center border-none`}>
                                <cat.icon className={`${cat.color}`} size="small" />
                            </div>
                            <span className="text-[13px] font-medium text-zinc-300">{cat.label}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[15px] font-bold text-white">{formatMs(cat.value)}</span>
                        </div>
                    </div>
                </motion.div>
             ))}
          </div>

          {practiceCategories.length === 0 && (
             <div className="py-8 text-center bg-[#1c1c1c] rounded-xl mt-4 border border-white/5">
                <p className="text-xs text-zinc-500 font-medium">Data unavailable</p>
             </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
