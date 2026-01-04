import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "assets/components/ui/tooltip";
import { useTranslation } from "react-i18next";

import type { AchievementProgress } from "../../types";

interface AchievementCardDesktopProps {
  name: string;
  description: string;
  children: React.ReactNode;
  progress?: AchievementProgress;
}

export const AchievementCardDesktop = ({ name, description, children, progress }: AchievementCardDesktopProps) => {
  const { t } = useTranslation("achievements");

  return (
    <Tooltip delayDuration={50}>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        sideOffset={35}
        className='z-[100] bg-white text-black border-none px-3 py-2 shadow-xl'
      >
        <h3 className='font-bold text-sm leading-tight'>{t(name as any)}</h3>
        <p className='text-xs mt-0.5 opacity-90'>{t(description as any)}</p>
        
        {progress && (
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between gap-4">
             <span className="text-[10px] font-bold text-gray-500 uppercase">Progress</span>
             <span className={`text-xs font-bold ${progress.current >= progress.max ? "text-amber-500" : "text-green-600"}`}>
                {progress.current} / {progress.max}
             </span>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
};
