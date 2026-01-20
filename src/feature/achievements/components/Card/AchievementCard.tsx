import React, { memo } from "react";
import { useResponsiveStore } from "store/useResponsiveStore";

import { achievementsMap } from "../../data/achievementsData";
import type { AchievementContext, AchievementList, AchievementsDataInterface } from "../../types";
import { AchievementCardDesktop } from "./AchievementCardDesktop";
import { AchievementCardMobile } from "./AchievementCardMobile";
import { AchievementPhysicalCard } from "./AchievementPhysicalCard";

export const AchievementCard = memo(({ 
  id, 
  data,
  context,
  isUnlocked,
  showProgress = false
}: { 
  id: AchievementList; 
  data?: AchievementsDataInterface;
  context?: AchievementContext | null;
  isUnlocked?: boolean;
  showProgress?: boolean;
}) => {
  const achievementData = data || achievementsMap.get(id);
  if (!achievementData) return null;
  
  const { Icon, rarity, description, name, getProgress } = achievementData;
  const isMobileView = useResponsiveStore((state) => state.isMobile);

  const rawProgress = context && getProgress ? getProgress(context) : undefined;
  const progress = (rawProgress && showProgress && !isUnlocked) ? {
    ...rawProgress,
    current: Math.min(rawProgress.current, rawProgress.max)
  } : undefined;

  const cardContent = (
    <AchievementPhysicalCard
      Icon={Icon}
      rarity={rarity}
      isMobileView={isMobileView}
      className={`rounded-lg ${isMobileView ? "h-10 w-10 md:h-11 md:w-11" : "h-9 w-9 md:h-11 md:w-11"}`}
    />
  );

  if (isMobileView) {
    return (
      <AchievementCardMobile 
        Icon={Icon}
        rarity={rarity}
        name={name}
        description={description}
        progress={progress}
      >
        {cardContent}
      </AchievementCardMobile>
    );
  }

  return (
    <AchievementCardDesktop
      name={name}
      description={description}
      progress={progress}
    >
      {cardContent}
    </AchievementCardDesktop>
  );
});

AchievementCard.displayName = "AchievementCard";
