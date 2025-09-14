import { AnimatePresence, motion } from "framer-motion";
import { ReactNode } from "react";

interface DashboardContainerProps {
  children: ReactNode;
  className?: string;
}

export const DashboardContainer = ({
  children,
  className = "",
}: DashboardContainerProps) => {
  return (
    <div className={`bg-second-600 radius-default ${className}`}>
      <div className='mt-6 space-y-6 p-4 md:p-6'>
        <AnimatePresence mode='wait'>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className='relative z-10'>
            <div className='space-y-6'>{children}</div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

