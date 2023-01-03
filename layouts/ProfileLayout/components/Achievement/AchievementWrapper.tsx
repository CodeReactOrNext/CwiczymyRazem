import {
  AchievementList,
  achievements,
  AchievementsInterface,
} from "data/achievements";
import AchievementBox from "./AchievementBox";

const AchievementWrapper = ({
  userAchievements,
}: {
  userAchievements: AchievementList[];
}) => {
  interface grupedAchievements {
    common: AchievementsInterface[];
    rare: AchievementsInterface[];
    veryRare: AchievementsInterface[];
  }

  const { common, rare, veryRare } =
    userAchievements.reduce<grupedAchievements>(
      ({ common, rare, veryRare }, userAchivId) => {
        const achievementData = achievements.find(
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
