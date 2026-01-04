import { Card } from "assets/components/ui/card";
import type {
  AchievementList,
  AchievementsDataInterface,
} from "feature/achievements/types";
import { achievementsData, achievementsMap, achievementsCounts } from "feature/achievements/data/achievementsData";
import { AchievementBox } from "feature/profile/components/Achievement/AchievementBox";
import { useAchievementContext } from "feature/achievements/hooks/useAchievementContext";

export const AchievementWrapper = ({
  userAchievements,
}: {
  userAchievements: AchievementList[];
}) => {
  const context = useAchievementContext();
  interface grupedAchievements {
    common: AchievementsDataInterface[];
    rare: AchievementsDataInterface[];
    veryRare: AchievementsDataInterface[];
    epic: AchievementsDataInterface[];
  }

  const { common, rare, veryRare, epic } =
    userAchievements.reduce<grupedAchievements>(
      ({ common, rare, veryRare, epic }, userAchivId) => {
        // O(1) Lookup
        const achievementData = achievementsMap.get(userAchivId);
        
        if (!achievementData) return { common, rare, veryRare, epic };

        switch (achievementData?.rarity) {
          case "common":
            common.push(achievementData);
            break;
          case "rare":
            rare.push(achievementData);
            break;
          case "veryRare":
            veryRare.push(achievementData);
            break;
          case "epic":
            epic.push(achievementData);
            break;
        }

        return { common, rare, veryRare, epic };
      },
      { common: [], rare: [], veryRare: [], epic: [] }
    );

  return (
    <Card>
      <AchievementBox
        achievment={common}
        maxLenght={achievementsCounts.common}
        rarity='common'
        context={context}
      />
      <AchievementBox achievment={rare} maxLenght={achievementsCounts.rare} rarity='rare' context={context} />
      <AchievementBox
        achievment={veryRare}
        maxLenght={achievementsCounts.veryRare}
        rarity='veryRare'
        context={context}
      />
      <AchievementBox achievment={epic} maxLenght={achievementsCounts.epic} rarity='epic' context={context} />
    </Card>
  );
};
