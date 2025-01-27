import type {
  AchievementList,
  AchievementsDataInterface,
} from "feature/achievements/achievementsData";
import { achievementsData } from "feature/achievements/achievementsData";

import AchievementBox from "../AchievementBox";

const AchievementWrapper = ({
  userAchievements,
}: {
  userAchievements: AchievementList[];
}) => {
  interface grupedAchievements {
    common: AchievementsDataInterface[];
    rare: AchievementsDataInterface[];
    veryRare: AchievementsDataInterface[];
  }

  const { common, rare, veryRare } =
    userAchievements.reduce<grupedAchievements>(
      ({ common, rare, veryRare }, userAchivId) => {
        const achievementData = achievementsData.find(
          (achiv) => achiv.id === userAchivId
        );
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
        }
        return { common, rare, veryRare };
      },
      { common: [], rare: [], veryRare: [] }
    );

  return (
    <>
      <AchievementBox achievment={common} rarity='common' />
      <AchievementBox achievment={rare} rarity='rare' />
      <AchievementBox achievment={veryRare} rarity='veryRare' />
    </>
  );
};
export default AchievementWrapper;
