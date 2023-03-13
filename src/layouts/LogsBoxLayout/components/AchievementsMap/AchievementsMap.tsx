import { useTranslation } from "react-i18next";

import { ToolTip } from "components/UI";

import {
  AchievementList,
  achievementsData,
} from "assets/achievements/achievementsData";
import { achievementsRarity } from "assets/achievements/achievementsRarity";
interface AchievementsMapProps {
  userAchievements: AchievementList[];
}

const AchievementsMap = ({ userAchievements }: AchievementsMapProps) => {
  const { t } = useTranslation("achievements");

  return (
    <div className='flex flex-row flex-wrap  items-center gap-7 border-b-2 border-main-opposed-400 py-2 lg:p-3 '>
      <ToolTip />
      {achievementsData.map(({ Icon, id, rarity, description }) => {
        const isUnlocked = userAchievements?.includes(id);
        return (
          <Icon
            key={id}
            className='text-3xl text-black/60  drop-shadow-md'
            color={isUnlocked ? achievementsRarity[rarity].color : ""}
            data-tip={isUnlocked ? t(description) : null}
          />
        );
      })}
    </div>
  );
};

export default AchievementsMap;
