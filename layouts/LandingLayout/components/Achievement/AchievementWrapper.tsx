import { achievements, AchievementsInterface } from "data/achievements";
import AchievementBox from "./AchievementBox";

const AchievementWrapper = ({
  userAchievements,
}: {
  userAchievements: string[];
}) => {
  interface grupedAchievements {
    common: AchievementsInterface[];
    rare: AchievementsInterface[];
    veryRare: AchievementsInterface[];
  }

  console.log(userAchievements);

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
    <div className=' row-cols-1 order-2 '>
      <AchievementBox achievment={common} rarity='common' />
      <AchievementBox achievment={rare} rarity='rare' />
      <AchievementBox achievment={veryRare} rarity='veryRare' />
    </div>
  );
};
export default AchievementWrapper;
