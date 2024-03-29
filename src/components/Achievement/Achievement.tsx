import { useTranslation } from "react-i18next";

import { ToolTip } from "components/UI";

import {
  AchievementList,
  achievementsData,
} from "assets/achievements/achievementsData";
import { achievementsRarity } from "assets/achievements/achievementsRarity";

const Achievement = ({ id }: { id: AchievementList }) => {
  const { t } = useTranslation("achievements");
  const achievementData = achievementsData.find((achiv) => achiv.id === id);
  const { Icon, rarity, description } = achievementData!;

  return (
    <>
      <Icon
        className='text-md cursor-help	drop-shadow-md'
        color={achievementsRarity[rarity].color}
        data-tip={t(description)}
      />
      <ToolTip />
    </>
  );
};

export default Achievement;
