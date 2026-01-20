import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

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
      className='mb-8 w-full rounded-lg bg-gradient-to-r from-cyan-600/30 via-cyan-500/10 to-transparent p-6 text-center border-none relative overflow-hidden'>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15),transparent)] animate-pulse" />
      <div className='relative z-10 flex items-center justify-center gap-4 text-white uppercase tracking-[0.4em] font-black'>
        <Sparkles className='h-6 w-6 text-cyan-400 fill-cyan-400' />
        <p className='text-xl sm:text-2xl drop-shadow-lg'>
          {t("rating_popup.new_level")}
        </p>
        <Sparkles className='h-6 w-6 text-cyan-400 fill-cyan-400' />
      </div>
    </motion.div>
  );
};
