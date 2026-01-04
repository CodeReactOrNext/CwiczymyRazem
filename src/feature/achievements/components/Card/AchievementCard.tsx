import { useResponsiveStore } from "store/useResponsiveStore";
import type { AchievementList, AchievementsDataInterface } from "../../types";
import { achievementsMap } from "../../data/achievementsData";
import { AchievementPhysicalCard } from "./AchievementPhysicalCard";
import { AchievementCardMobile } from "./AchievementCardMobile";
import { AchievementCardDesktop } from "./AchievementCardDesktop";

export const AchievementCard = ({ 
  id, 
  data 
}: { 
  id: AchievementList; 
  data?: AchievementsDataInterface;
}) => {
  const achievementData = data || achievementsMap.get(id);
  if (!achievementData) return null;
  
  const { Icon, rarity, description, name } = achievementData;
  const isMobileView = useResponsiveStore((state) => state.isMobile);

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
      >
        {cardContent}
      </AchievementCardMobile>
    );
  }

  return (
    <AchievementCardDesktop
      name={name}
      description={description}
    >
      {cardContent}
    </AchievementCardDesktop>
  );
};
