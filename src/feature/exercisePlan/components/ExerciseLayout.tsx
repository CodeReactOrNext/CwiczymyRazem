import { cn } from "assets/lib/utils";
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

export const ExerciseLayout = ({ 
  children, 
  title, 
  actions, 
  className 
}: ExerciseLayoutProps) => {
  return (
    <div className='flex min-h-screen flex-col'>


      <main className='relative z-10 flex-1 py-4 md:py-12'>
        <div className="container mx-auto px-3 md:px-0">
            <div className='transition-all'>
            {children}
            </div>
        </div>
      </main>
    </div>
  );
};
