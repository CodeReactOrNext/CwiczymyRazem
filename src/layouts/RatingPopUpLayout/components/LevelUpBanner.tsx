import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { MdUpgrade } from "react-icons/md";

export const LevelUpBanner = () => {
  const { t } = useTranslation("report") as any;

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
      className='mb-4 w-full rounded-lg border border-second-400/30 bg-gradient-to-r from-main-300/20 to-transparent p-3 text-center sm:p-4'>
      <div className='flex items-center justify-center gap-2 text-white sm:gap-3'>
        <MdUpgrade className='text-2xl text-main-300 sm:text-3xl' />
        <p className='text-lg font-semibold sm:text-xl'>
          {t("rating_popup.new_level")}
        </p>
      </div>
    </motion.div>
  );
};
