import { motion } from "framer-motion";

interface WeekProgressProps {
  completedDays: number;
  totalDays?: number;
}

export const WeekProgress = ({ completedDays, totalDays = 7 }: WeekProgressProps) => {
  const percentage = (completedDays / totalDays) * 100;

  return (
    <div className="relative">
      <div className="flex items-center justify-end mb-2">
        <span className="text-sm font-black text-white">
          {completedDays}/{totalDays}
        </span>
      </div>
      
      <div className="relative h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
        />
      </div>
    </div>
  );
};
