import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { Sparkles } from "lucide-react";

export const LevelUpBanner = () => {
  const { t } = useTranslation("report") as any;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 20,
        delay: 0.2 
      }}
      className='mb-4 w-full rounded-2xl bg-zinc-900 border border-white/5 p-4 text-center relative overflow-hidden flex items-center justify-center'>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1),transparent)]" />
      <div className='relative z-10 flex items-center justify-center gap-3 text-white tracking-wide font-medium'>
        <Sparkles className='h-4 w-4 text-cyan-400' />
        <p className='text-[15px]'>
          {t("rating_popup.new_level")}
        </p>
        <Sparkles className='h-4 w-4 text-cyan-400' />
      </div>
    </motion.div>
  );
};
