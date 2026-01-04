import { useEffect, useState } from "react";
import { useMedia } from "react-use";
import type { AchievementList } from "../../types";
import { achievementsData } from "../../data/achievementsData";
import { AchievementPhysicalCard } from "./AchievementPhysicalCard";
import { AchievementCardMobile } from "./AchievementCardMobile";
import { AchievementCardDesktop } from "./AchievementCardDesktop";

export const AchievementCard = ({ id }: { id: AchievementList }) => {
  const achievementData = achievementsData.find((achiv) => achiv.id === id);
  if (!achievementData) return null;
  
  const { Icon, rarity, description, name } = achievementData;
  
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useMedia("(max-width: 768px)", false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isMobileView = isMounted && isMobile;

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
