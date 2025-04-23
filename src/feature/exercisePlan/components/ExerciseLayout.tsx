import { motion } from "framer-motion";
import type { ReactNode } from "react";

import type { LocalizedContent } from "../types/exercise.types";

interface ExerciseLayoutProps {
  children: ReactNode;
  title: string | LocalizedContent;
  actions?: ReactNode;
  showBreadcrumbs?: boolean;
  className?: string;
}

export const ExerciseLayout = ({ children, actions }: ExerciseLayoutProps) => {
  return (
    <div className='flex min-h-screen flex-col'>
      <header>
        <div className='container relative z-10'>
          <div className='flex items-center justify-between gap-4'>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className='flex items-center gap-3 pr-2'>
              {actions}
            </motion.div>
          </div>
        </div>
      </header>

      <main className='container relative z-10 flex-1 py-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className='rounded-xl border border-border/30 bg-card/30 p-6 shadow-md backdrop-blur-[2px]'>
          {children}
        </motion.div>
      </main>
    </div>
  );
};
