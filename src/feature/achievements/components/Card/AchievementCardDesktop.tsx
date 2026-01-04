import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "assets/components/ui/tooltip";
import { useTranslation } from "react-i18next";

interface AchievementCardDesktopProps {
  name: string;
  description: string;
  children: React.ReactNode;
  progress?: { current: number; max: number };
}

export const AchievementCardDesktop = ({ name, description, children, progress }: AchievementCardDesktopProps) => {
  const { t } = useTranslation("achievements");

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className='z-[100] bg-white text-black border-none px-3 py-2 shadow-xl'
      >
        <h3 className='font-bold text-sm leading-tight'>{t(name as any)}</h3>
        <p className='text-xs mt-0.5 opacity-90'>{t(description as any)}</p>
        
        {progress && progress.current < progress.max && (
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between gap-4">
             <span className="text-[10px] font-bold text-gray-500 uppercase">Progress</span>
             <span className="text-xs font-bold text-green-600">{progress.current} / {progress.max}</span>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
};
