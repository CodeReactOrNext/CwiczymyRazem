import { Card } from "assets/components/ui/card";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { convertMsToHM } from "utils/converter";

interface SessionStatsProps {
  actualDayWithoutBreak: number;
  habitsCount: number;
  time: number;
}

export const SessionStats = ({
  actualDayWithoutBreak,
  habitsCount,
  time,
}: SessionStatsProps) => {
  const { t } = useTranslation(["report"]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.1 }}>
      <Card className='border-white/10 bg-zinc-900/50 backdrop-blur-sm'>
        <div className='p-3'>
          <h3 className='mb-2 text-sm font-semibold text-white'>Session Summary</h3>
          <div className='grid gap-1.5 text-xs text-secondText sm:gap-2 sm:text-sm'>
            <p className='flex items-center gap-2'>
              <span className='h-1.5 w-1.5 rounded-full bg-main-300 sm:h-2 sm:w-2'></span>
              <span className='font-bold text-white'>{actualDayWithoutBreak}</span>{" "}
              streak
            </p>
            <p className='flex items-center gap-2'>
              <span className='h-1.5 w-1.5 rounded-full bg-main-300 sm:h-2 sm:w-2'></span>
              you have adopted {habitsCount} healthy habit
            </p>
            <p className='flex items-center gap-2'>
              <span className='h-1.5 w-1.5 rounded-full bg-main-300 sm:h-2 sm:w-2'></span>
             you practiced for{" "}
              <span className='font-bold text-white'>{convertMsToHM(time)}</span>
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
