import { Card } from "assets/components/ui/card";
import Link from "next/link";
import { FaMapMarkedAlt } from "react-icons/fa";
import type {
  AchievementList,
  AchievementsDataInterface,
} from "feature/achievements/types";
import {  achievementsMap, achievementsCounts } from "feature/achievements/data/achievementsData";
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

  if (userAchievements.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed border-zinc-700/50">
        <FaMapMarkedAlt className="w-12 h-12 mb-4 text-zinc-600" />
        <p className="text-zinc-400">No achievements unlocked yet. Check your progress on the Achievements Map.</p>
      </Card>
    );
  }

  return (
    <Card className="divide-y divide-white/5">
      {common.length > 0 && (
        <div className="p-4">
          <AchievementBox
            achievment={common}
            maxLenght={achievementsCounts.common}
            rarity='common'
            context={context}
          />
        </div>
      )}
      {rare.length > 0 && (
        <div className="p-4">
           <AchievementBox achievment={rare} maxLenght={achievementsCounts.rare} rarity='rare' context={context} />
        </div>
      )}
      {veryRare.length > 0 && (
        <div className="p-4">
          <AchievementBox
            achievment={veryRare}
            maxLenght={achievementsCounts.veryRare}
            rarity='veryRare'
            context={context}
          />
        </div>
      )}
      {epic.length > 0 && (
        <div className="p-4">
           <AchievementBox achievment={epic} maxLenght={achievementsCounts.epic} rarity='epic' context={context} />
        </div>
      )}
    </Card>
  );
};
