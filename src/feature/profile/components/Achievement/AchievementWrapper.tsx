import type {
  AchievementList,
  AchievementsDataInterface,
} from "feature/achievements/achievementsData";
import { achievementsData } from "feature/achievements/achievementsData";
import { AchievementBox } from "feature/profile/components/Achievement/AchievementBox";

export const AchievementWrapper = ({
  userAchievements,
}: {
  userAchievements: AchievementList[];
}) => {
  interface grupedAchievements {
    common: AchievementsDataInterface[];
    rare: AchievementsDataInterface[];
    veryRare: AchievementsDataInterface[];
    epic: AchievementsDataInterface[];
  }

  const { common, rare, veryRare, epic } =
    userAchievements.reduce<grupedAchievements>(
      ({ common, rare, veryRare, epic }, userAchivId) => {
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
          case "epic":
            epic.push(achievementData);
            break;
        }

        return { common, rare, veryRare, epic };
      },
      { common: [], rare: [], veryRare: [], epic: [] }
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

  const epicLenght = achievementsData.filter(
    (achivement) => achivement.rarity === "epic"
  ).length;

  return (
    <div className='content-box mb-4 flex flex-col gap-4 font-openSans text-sm '>
      <AchievementBox
        achievment={common}
        maxLenght={commonLenght}
        rarity='common'
      />
      <AchievementBox achievment={rare} maxLenght={rareLenght} rarity='rare' />
      <AchievementBox
        achievment={veryRare}
        maxLenght={veryRareLenght}
        rarity='veryRare'
      />
      <AchievementBox achievment={epic} maxLenght={epicLenght} rarity='epic' />
    </div>
  );
};
