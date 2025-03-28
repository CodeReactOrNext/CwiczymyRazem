import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

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
  className,
}: ExerciseLayoutProps) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language as "pl" | "en";

  const getLocalizedContent = (content: string | LocalizedContent): string => {
    if (typeof content === "string") {
      return content;
    }
    return content[currentLang] || content.pl;
  };

  return (
    <div className='flex min-h-screen flex-col bg-background/40'>
      <motion.header
        initial={{ opacity: 0.8, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "relative shadow-lg backdrop-blur-sm transition-all duration-300",
          "pb-1",
          className
        )}>
        <div
          className='absolute inset-0'
          style={{
            background:
              "linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to))",
            clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 4px), 0 100%)",
            opacity: 0.85,
          }}
        />

        <div
          className='absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/90 via-primary/60 to-transparent'
          style={{
            boxShadow: "0 1px 4px rgba(var(--primary-rgb), 0.4)",
          }}
        />

        <div className='container relative z-10 py-7'>
          <div className='flex items-center justify-between gap-4 pl-4 md:pl-6'>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className='text-2xl font-bold tracking-tight text-foreground drop-shadow-md'
              style={{
                textShadow: "0 2px 4px rgba(0,0,0,0.15)",
              }}>
              {getLocalizedContent(title)}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className='flex items-center gap-3 pr-2'>
              {actions}
            </motion.div>
          </div>
        </div>
      </motion.header>

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
