import { motion } from "framer-motion";
import { cn } from "assets/lib/utils";
import type { ReactNode } from "react";

import type { LocalizedContent } from "../types/exercise.types";

interface ExerciseLayoutProps {
  children: ReactNode;
  title: string | LocalizedContent;
  actions?: ReactNode;
  showBreadcrumbs?: boolean;
  className?: string;
}

export const ExerciseLayout = ({ 
  children, 
  title, 
  actions, 
  className 
}: ExerciseLayoutProps) => {
  return (
    <div className='flex min-h-screen flex-col'>
      <header className={cn("sticky top-0 z-[60] w-full border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl", className)}>
        <div className='container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between gap-4'>
            <div className="flex items-center gap-4 overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col min-w-0"
                >
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 truncate">
                        Training Mode
                    </span>
                    <h1 className="text-sm font-bold text-white truncate">
                        {typeof title === "string" ? title : title.en}
                    </h1>
                </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className='flex items-center gap-3 shrink-0'>
              {actions}
            </motion.div>
        </div>
      </header>

      <main className='relative z-10 flex-1 py-8'>
        <div className="container mx-auto px-4">
            <div className='transition-all'>
            {children}
            </div>
        </div>
      </main>
    </div>
  );
};
