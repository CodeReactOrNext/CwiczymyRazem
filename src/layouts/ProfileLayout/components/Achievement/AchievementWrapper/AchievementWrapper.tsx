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

  const commonLenght = achievementsData.filter(
    (achivement) => achivement.rarity === "common"
  ).length;

  const rareLenght = achievementsData.filter(
    (achivement) => achivement.rarity === "rare"
  ).length;

  const veryRareLenght = achievementsData.filter(
    (achivement) => achivement.rarity === "veryRare"
  ).length;

  return (
    <>
      <AchievementBox achievment={common} maxLenght={commonLenght} rarity='common' />
      <AchievementBox achievment={rare}  maxLenght={rareLenght} rarity='rare' />
      <AchievementBox achievment={veryRare}  maxLenght={veryRareLenght} rarity='veryRare' />
    </>
  );
};
export default AchievementWrapper;
