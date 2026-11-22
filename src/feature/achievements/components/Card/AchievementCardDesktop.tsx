import { Tooltip, TooltipContent, TooltipTrigger } from "assets/components/ui/tooltip";
import { useTranslation } from "hooks/useTranslation";
import React from "react";

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
        className='z-[100] py-2'
      >
        <h3 className='font-bold text-sm leading-tight'>{t(name as any)}</h3>
        <p className='text-xs mt-0.5 font-normal text-black/60'>{t(description as any)}</p>

        {progress && (
          <div className="mt-3 flex items-center justify-between gap-4">
             <span className="text-xs font-bold text-black/60">{t("progress", "Progress")}</span>
             <span className={`text-xs font-bold ${progress.current >= progress.max ? "text-amber-700" : "text-emerald-700"}`}>
                {progress.current} / {progress.max}
             </span>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
};
