import { useResponsiveStore } from "store/useResponsiveStore";
import type { AchievementContext, AchievementList, AchievementsDataInterface } from "../../types";
import { achievementsMap } from "../../data/achievementsData";
import { AchievementPhysicalCard } from "./AchievementPhysicalCard";
import { AchievementCardMobile } from "./AchievementCardMobile";
import { AchievementCardDesktop } from "./AchievementCardDesktop";

export const AchievementCard = ({ 
  id, 
  data,
  context,
  isUnlocked
}: { 
  id: AchievementList; 
  data?: AchievementsDataInterface;
  context?: AchievementContext | null;
  isUnlocked?: boolean;
}) => {
  // O(1) Lookup - prioritizing passed data
  const achievementData = data || achievementsMap.get(id);
  if (!achievementData) return null;
  
  const { Icon, rarity, description, name, getProgress } = achievementData;
  const isMobileView = useResponsiveStore((state) => state.isMobile);

  const progress = context && getProgress && !isUnlocked ? getProgress(context) : undefined;

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
};
