import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "assets/components/ui/tooltip";
import { useTranslation } from "react-i18next";

interface AchievementCardDesktopProps {
  name: string;
  description: string;
  children: React.ReactNode;
}

export const AchievementCardDesktop = ({ name, description, children }: AchievementCardDesktopProps) => {
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
      </TooltipContent>
    </Tooltip>
  );
};
